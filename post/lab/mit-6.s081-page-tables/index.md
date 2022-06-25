
# 1. Overview

In this lab you will explore page tables and modify them to speed up certain system calls and detect which pages have been accessed.

# 2. Speed up system calls

First, add a page in user mode.
```c
// kernel/proc.c

// Create a user page table for a given process,
// with no user memory, but with trampoline pages.
pagetable_t
proc_pagetable(struct proc *p)
{
  // ...
  // map the trapframe just below TRAMPOLINE, for trampoline.S.
  if(mappages(pagetable, TRAPFRAME, PGSIZE,
              (uint64)(p->trapframe), PTE_R | PTE_W) < 0){
    uvmunmap(pagetable, TRAMPOLINE, 1, 0);
    uvmfree(pagetable, 0);
    return 0;
  }

  #ifdef LAB_PGTBL
  if(mappages(pagetable, USYSCALL, PGSIZE,
              (uint64)(p->usyscall), PTE_R | PTE_U) < 0){
    uvmunmap(pagetable, TRAMPOLINE, 1, 0);
    uvmunmap(pagetable, TRAPFRAME, 1, 0);
    uvmfree(pagetable, 0);
    return 0;
  }
  #endif

  return pagetable;
}
```
Allocate and initialize the page in allocproc() and free it in freeproc().
```c
// kernel/proc.c
static struct proc*
allocproc(void)
{
  // ...
  // Allocate a trapframe page.
  if((p->trapframe = (struct trapframe *)kalloc()) == 0){
    freeproc(p);
    release(&p->lock);
    return 0;
  }

  if((p->usyscall = (struct usyscall *)kalloc()) == 0){
    freeproc(p);
    release(&p->lock);
    return 0;
  }
  p->usyscall->pid = p->pid;

  // An empty user page table.
  // ...
  return p;
}

static void
freeproc(struct proc *p)
{
  if(p->trapframe)
    kfree((void*)p->trapframe);
  p->trapframe = 0;
  if (p->usyscall) 
    kfree((void *)p->usyscall);
  p->usyscall = 0;
  if(p->pagetable)
    proc_freepagetable(p->pagetable, p->sz);
  // ...
}
```

# 2. Print a page table
 
Just refer to freewalk function recursion.

```c
// kernel/vm.c
void
vmprint_helper(pagetable_t pagetable, int depth) {
  // there are 2^9 = 512 PTEs in a page table.
  for(int i = 0; i < 512; i++) {
    pte_t pte = pagetable[i];
    if(pte & PTE_V) {
      for (int i=0; i<depth; i++) printf(" ..");
      printf("%d: pte %p pa %p\n", i, pte, PTE2PA(pte));
      if ((pte & (PTE_R|PTE_W|PTE_X)) == 0) {
        // this PTE points to a lower-level page table.
        uint64 child = PTE2PA(pte);
        vmprint_helper((pagetable_t)child, depth + 1);
      } 
    }
  }
}

// Recursively print page-table pages.
// All leaf mappings must already have been removed.
void
vmprint(pagetable_t pagetable){
  printf("page table %p\n", pagetable);
  vmprint_helper(pagetable, 1); 
}
```

# 3. Detecting which pages have been accessed

Consult the RISC-V manual, Each PTE contains flag bits that tell the paging hardware how the associated virtual address is allowed to be used.

- V - Valid
- R - Readable
- W - Writeable
- X - Executable
- U - User
- G - Global
- A - Accessed
- D - Dirty (0 in page directory)

We need to add define PTE_A to 1L\<\<6, not 1L\<\<5.
```c
#define PTE_V (1L << 0) // valid
#define PTE_R (1L << 1)
#define PTE_W (1L << 2)
#define PTE_X (1L << 3)
#define PTE_U (1L << 4) // 1 -> user can access
#define PTE_A (1L << 6) // the access bit
```
Then implements the function pgaccess. Be careful about clearing pte after calling this function.
```c
// kernel/proc.c
// reports which pages have been accessed
// va: virtual address of the first user page to check
// num: the number of pages to check.
// buf: one bit per page and where the first page corresponds to the least significant bit
uint64
pgaccess(uint64 va, uint64 num, uint64 buf) {
  struct proc *p = myproc();
  if (p == 0) return 0;
  pagetable_t pagetable = p->pagetable;
  int ans = 0;
  for (int i = 0; i < num; i++) {
    pte_t *pte = walk(pagetable, va + PGSIZE * i, 0);
    if (pte != 0) {
      if (*pte & PTE_A) {
        ans |= 1 << i;  // change the bitmask
        *pte ^= PTE_A;  // clear PTE_A after checking if it is set.
      }
    }
  }
  return ans;
}
```

And finally add this syscall, we will return the copyout of the pagetable.

```c
// kernel/sysproc.c
int
sys_pgaccess(void)
{
  // lab pgtbl: your code here.
  uint64 va, num, buf;
  if(argaddr(0, &va) < 0) return -1;
  if(argaddr(1, &num) < 0) return -1;
  if(argaddr(2, &buf) < 0) return -1;

  int access = pgaccess(va, num, buf);
  return copyout(myproc()->pagetable, buf, (char *)&access, sizeof(int));
}
```
