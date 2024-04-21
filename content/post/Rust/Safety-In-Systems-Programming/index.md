---
title: "Safety in Systems Programming"
date: 2022-02-19T23:20:42+08:00
lastmod: 2022-02-19T23:20:42+08:00
draft: false
author: "Chasing1020"
comment: true
keywords: []
description: ""
tags: ['Safety']
categories: ['Language']
image: 'rust.webp'
---


The gets() function cannot be used securely.  Because of its lack of bounds checking,
     and the inability of the calling program to reliably determine the length of the
     next incoming line, the use of this function enables malicious users to arbitrarily
     change a running program's functionality through a buffer overflow attack.  It is
     strongly suggested that the fgets() function be used in all cases.



How can we find and/or prevent problems like this? 

-   Dynamic analysis: Run the program, watch what it does, and look for problematic behavior.
-   Static analysis: read the source code and try to spot the issues.
-   Write code differently: create habits and frameworks that make it harder to produce these kinds of mistakes.
-   Sandbox: accept that these issues will happen, but try to minimize the consequences.



