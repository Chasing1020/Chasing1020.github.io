
# 0. Preface

It has been a long time since I decided to do labs related to operating systems.
Cause MIT may have the best teaching operating system xv6, and it has a nice [handout](https://pdos.csail.mit.edu/6.S081/2021/xv6/book-riscv-rev2.pdf). So I decided to take some time to work out it for improving my understanding of systems programming. The process of the labs will be recorded here, and I am still not sure whether I will combine each blog up or just separate them. Wish I could keep it up.

# 1. Overview

This lab is just about learning to set up the qemu and to write some programs similar to the Unix utilities.

# 2. Boot xv6

It is quite simple to install the environment vis the [reference](https://pdos.csail.mit.edu/6.S081/2021/tools.html), and just run the command below.
```shell
sudo apt-get install git build-essential gdb-multiarch qemu-system-misc gcc-riscv64-linux-gnu binutils-riscv64-linux-gnu

make qemu
```

# 3. Sleep

Notice that the sleep syscall uses 0.1 seconds as a unit and don't forget to add line `$U/_sleep\` in the $UPROGS in Makefile.

```c
#include "kernel/types.h"
#include "kernel/stat.h"
#include "user/user.h"

int
main(int argc, char *argv[]) {
  if (argc <= 1) {
    fprintf(2, "Usage: sleep seconds...");
    exit(1);
  }
  int seconds = atoi(argv[1]) * 10;
  sleep(seconds);
  exit(0);
}
```

# 4. Pingpong

The parent and Child process will share the pipe file description.

```c
#include "kernel/types.h"
#include "kernel/stat.h"
#include "user/user.h"

int
main(int argc, char *argv[]) {
  int fd[2];
  pipe(fd);
  int pid = fork();
  char msg = ' ';
  if (pid < 0) {
    fprintf(2, "Syscall fork failed\n");
    exit(1);
  } else if (pid == 0) { // Child process
    if (read(fd[0], &msg, 1) != 1) {
      fprintf(2, "Child: failed to read\n");
      exit(1);
    }
    close(fd[0]);
    
    printf("%d: received ping\n", getpid());
    if (write(fd[1], &msg, 1) != 1) {
      fprintf(2, "Child: failed to write\n");
      exit(1);
    }
    close(fd[1]);
  } else { // Parent process
    if (write(fd[1], &msg, 1) != 1) {
      fprintf(2, "Parent: failed to write\n");
      exit(1);
    }
    close(fd[1]);

    if (read(fd[0], &msg, 1) != 1) {
      fprintf(2, "Parent: failed to read\n");
      exit(1);
    }
    close(fd[0]);

    printf("%d: received pong\n", getpid());
  }
  exit(0);
}
```

# 5. Primes
This program will use pipe and fork to set up the pipeline.
For each prime number, the process reads from its left neighbor over a pipe and writes to its right neighbor over another pipe. 
```txt
2,3,4,   filter 2   2,3,5,7,  filter 3   2,3,5,7,
5,6,7,  ----------> 9,11,13, ----------> 11,13,17, --> all primes in [2..35]
8,..,35             15,..,35             19,..,35
```

```c
#include "kernel/types.h"
#include "kernel/stat.h"
#include "user/user.h"

void
primes(int *fd) {
  int p, q;
  close(fd[1]);
  if (read(fd[0], (void *)&p, sizeof(p)) != sizeof(int)) {
    fprintf(2, "Read fd[0] failed\n");
    exit(1);
  }
  printf("prime %d\n", p); // the first prime passed by left neighbor
  if (read(fd[0], (void *)&q, sizeof(q))) {
    int fd1[2];
    pipe(fd1);
    int pid = fork();
    if (pid < 0) {
      fprintf(2, "Syscall fork failed\n");
      exit(1);
    } else if (pid == 0) { // Child process
      primes(fd1);
    } else { // Parent process
      close(fd1[0]);
      do {
        if (q % p != 0) {
          write(fd1[1], (void *)&q, sizeof(q));
        }
      } while (read(fd[0], (void *)&q, sizeof(q)) == sizeof(int));
      close(fd[0]);
      close(fd1[1]);
      wait(0);
    }
  }
  exit(0);
}

int
main(int argc, char *argv[]) {
  int fd[2];
  int start = 2;
  int end = 35;
  pipe(fd);
  int pid = fork();
  if (pid < 0) {
    fprintf(2, "Syscall fork failed\n");
    exit(1);
  } else if (pid == 0) { // Child process
    primes(fd);
  } else { // Parent process
    close(fd[0]);
    for (int i = start; i <= end; i++) {
      if (write(fd[1], (void *)&i, sizeof(i)) != sizeof(int)) {
        fprintf(2, "Write value %d to pipefd[1] failed\n", i);
        exit(1);
      }
    }
    close(fd[1]);
    wait(0);
  }
  exit(0);
}
```

# 6. Find

Just look at the ls.c and notice the recursive won't traverse `.` and `..`.

```c
#include "kernel/types.h"
#include "kernel/stat.h"
#include "user/user.h"
#include "kernel/fs.h"

char *
fmtname(char *path) {
  static char buf[DIRSIZ + 1];
  char *p;

  // Find first character after last slash.
  for (p = path + strlen(path); p >= path && *p != '/'; p--)
    ;
  p++;

  // Return blank-padded name.
  if (strlen(p) >= DIRSIZ)
    return p;
  memmove(buf, p, strlen(p));
  memset(buf + strlen(p), ' ', DIRSIZ - strlen(p));
  return buf;
}

void
find(char *path, char *filename) {
  char buf[512], *p;
  int fd;
  struct dirent de;
  struct stat st;

  if ((fd = open(path, 0)) < 0) {
    fprintf(2, "find: cannot open %s\n", path);
    return;
  }
  if (fstat(fd, &st) < 0) {
    fprintf(2, "find: cannot stat %s\n", path);
    close(fd);
    return;
  }
  if (read(fd, &de, sizeof(de)) != sizeof(de)) {
    fprintf(2, "find: cannot open %s", path);
    exit(1);
  }

  switch (st.type) {
  case T_FILE:
    if (strcmp(fmtname(path), filename) == 0) {
      printf("%s/%s\n", path, filename); // e.g. `find a.c a.c` will print `a.c`
    }
    break;

  case T_DIR:
    if (strlen(path) + 1 + DIRSIZ + 1 > sizeof buf) {
      printf("find: path too long\n");
      break;
    }
    strcpy(buf, path);
    p = buf + strlen(buf);
    *p++ = '/';
    while (read(fd, &de, sizeof(de)) == sizeof(de)) {
      if (de.inum == 0 || 
          strcmp(de.name, ".") == 0 ||
          strcmp(de.name, "..") == 0) {
        continue;
      }
      memmove(p, de.name, DIRSIZ);
      p[DIRSIZ] = 0;
      if (stat(buf, &st) < 0) {
        fprintf(2, "find: cannot stat %s\n", buf);
        continue;
      }
      switch (st.type) {
      case T_FILE:
        if (strcmp(filename, de.name) == 0) {
          printf("%s/%s\n", path, filename);
        }
        break;
      case T_DIR:
        find(buf, filename);
      }
    }
  }
  close(fd);
}

int
main(int argc, char *argv[]) {
  if (argc < 3) {
    fprintf(2, "Usage: find <path> <target>\n");
    exit(1);
  } else {
    char *path = argv[1];
    char *target = argv[2];
    find(path, target);
  }
  exit(0);
}
```

# 7. Xargs

The idea is to use buffer records whole stdin.
e.g. input `echo hello world\n` will be converted to `echo\0hello\0world\0`.
~~It is ridiculous to use '\0' to present the end of the string.~~

```c
#include "kernel/types.h"
#include "kernel/stat.h"
#include "user/user.h"
#include "kernel/param.h"

int
main(int argc, char *argv[]) {
  char buf[1024];
  char *c = buf, *pre_c = buf;
  char *argsbuf[MAXARG];
  char **args = argsbuf;
  for (int i = 1; i < argc; i++) {
    *args = argv[i];
    args++;
  }
  char **args_p = args;
  while (read(0, c, 1) != 0) {
    if (*c == ' ' || *c == '\n') {
      *c = '\0';
      *(args_p++) = pre_c;
      pre_c = c + 1;
      if (*c == '\n' || *c == '\0') { // new line or eof
        *args_p = '\0';
        if (fork() == 0) {
          exec(argv[1], argsbuf);
          exit(0);
        }
        wait(0);
        args_p = args;
      }
    }
    c++;
  }
  exit(0);
}
```
