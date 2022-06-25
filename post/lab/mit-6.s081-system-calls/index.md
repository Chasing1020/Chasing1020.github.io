
# 1. Overview

This lab is about learning to implement the raw system calls.

# 2. System call tracing

Before we implement the tracing, there are some pre-steps to register the system call. 
Initially, add $U/_trace to UPROGS in Makefile.
Then add these lines in `user/user.h`, `user/usys.pl`, `kernel/syscall.h` and `kernel/syscall.c`.
```c
// user/user.h

// system calls
int fork(void);
// ...
int uptime(void);
int trace(int); // add here
```
```perl
# user/usys.pl

entry("fork");
# ...
entry("uptime");
entry("trace"); # add here
```
```c
// kernel/syscall.h

// System call numbers
#define SYS_fork    1
// ...
#define SYS_close  21
#define SYS_trace  22 // add here
```
```c
// kernel/syscall.c

extern uint64 sys_chdir(void);
// ...
extern uint64 sys_trace(void); // add here

static uint64 (*syscalls[])(void) = {
[SYS_fork]    sys_fork,
// ...
[SYS_trace]   sys_trace, // add here
};

// convert number to string for debugging
static const char *syscall_names[] = {
[SYS_fork]    "fork",
// ...
[SYS_trace]   "trace",
};
```

And We also need a flag to record the syscall trace status, and I name it `strace`.

```c
// kernel/proc.h

// Per-process state
struct proc {
  struct spinlock lock;
  // ...
  char name[16];               // Process name (debugging)

  int strace;                  // The syscall trace (add here)
};
```

And don't forget to initialize the strace flag to zero, and modify the fork function.
```c
// kernel/proc.c

static struct proc*
allocproc(void)
{
  struct proc *p;
  // ...

found:
  p->pid = allocpid();
  p->state = USED;

  p->strace = 0; // add here

  // Allocate a trapframe page.
  // ...
  return p;
}

int
fork(void)
{
  // ...

  pid = np->pid;
  np->strace = p->strace; // add here

  // ...
  return pid;
}
```

When a child process uses a syscall, it will compare to the mask to check whether this call number is monitored by its parent.

```c
// kernel/syscall.c

void
syscall(void)
{
  int num;
  struct proc *p = myproc();

  num = p->trapframe->a7;
  if(num > 0 && num < NELEM(syscalls) && syscalls[num]) {
    p->trapframe->a0 = syscalls[num]();

    if(p->strace >> num & 1) {
      printf("%d: syscall %s -> %d\n",p->pid, syscall_names[num], p->trapframe->a0);
    }

  } else {
    printf("%d %s: unknown sys call %d\n",
            p->pid, p->name, num);
    p->trapframe->a0 = -1;
  }
}
```

Finally, implements the sys_trace() function, and just move the mask to children.
```c
// kernel/sysproc.c

uint64
sys_trace(void) {
  int mask;

  if(argint(0, &mask) < 0)
    return -1;

  myproc()->strace = mask;
  return 0;
}
```

# 3. Sysinfo

To add this syscall, you just need to follow the same steps as in the previous assignment.

What we need to do about this syscall is to add two functions to watch the system's free memory size and the number of free processes.

```c
// kernel/kalloc.c

// Traverse all the available pages of physical memory.
// Returns a uint64 about the free memory size.
uint64
kavailable(void) {

  uint64 pages = 0;

  acquire(&kmem.lock);
  struct run *r = kmem.freelist;
  while(r) {
    pages++;
    r = r->next;
  }
  release(&kmem.lock);
  
  return pages * PGSIZE;
}
```

```c
// kernel/proc.c

// Returns the number of unused process
uint64
procnum(void) {
  uint64 num = 0;
  for(struct proc *p = proc; p < &proc[NPROC]; p++) {
    if(p->state != UNUSED) {
      num++;
    }
  }
  return num;
}
```

And implements the function, in reference to the file kernel/file.c.
```c
// kernel/sysproc.c
uint64
sys_sysinfo(void) {
  uint64 addr;
  if(argaddr(0, &addr) < 0)
    return -1;
  struct sysinfo sinfo;
  sinfo.freemem = kavailable(); // from kernel/kalloc.c
  sinfo.nproc = procnum();      // from kernel/proc.c
  
  if(copyout(myproc()->pagetable, addr, (char *)&sinfo, sizeof(sinfo)) < 0)
    return -1;
  return 0;
}
```