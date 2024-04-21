---
title: "Software Engineering"
date: 2022-03-03T13:47:04+08:00
lastmod: 2022-03-03T13:47:04+08:00
draft: false
author: "Chasing1020"
comment: true
keywords: []
description: ""
tags: ['Software Engineering']
categories: ['Note']
image: "code.webp"
---

# Overview

**Software** is more than just a program code. It is considered to be collection of executable programming code, associated libraries and documentations. 

**Engineering** on the other hand, is all about developing products, using well-defined, scientific principles and methods. 

>   IEEE Definition

(1) The application of a systematic, disciplined, quantifiable approach to the development, operation, and maintenance of software; that is, the application of engineering to software. 

(2) The study of approaches as in the above statement. 



Evolution: Change Request > Impact Analysis > Release Planning > System update > System Release.

>   Three categories

1. Static-type (S-type): This is a software, which works strictly according to defined specifications and solutions. For example, calculator program for mathematical computation .

2.   Practical-type (P-type) : This is a software with a collection of procedures which specifications can be described but the solution is not obviously instant. For example, gaming software. 
3.   Embedded-type (E-type): This software works closely as the requirement of real-world environment. For example, Online trading software.

Needs of Software Engineering: Large, Scalability, Cost, Dynamic Nature, Quality Management.

# Development Life Cycle

Software Life Cycle Activities: Communication, Requirement Gathering, Feasibility Study, System Analysis, Software Design, Coding, Testing, Integration, Implementation, Operations & Maintenance, Disposition.

1.   Communication: This is the first step where the user initiates the request for a desired software product. 

2.   Requirement Gathering: This step onwards the software development team works to carry on the project. 

3.   Feasibility Study: After requirement gathering, the team comes up with a rough plan of software process. 

4.   System Analysis: At this step the developers decide a roadmap of their plan and try to bring up the best software model suitable for the project. 

5.   Software Design: Next step is to bring down whole knowledge of requirements and analysis on the desk and design the software product. 

6.   Coding: This step is also known as programming phase. 

7.   Testing: An estimate says that 50% of whole software development process should be tested. 

8.   Integration: Software may need to be integrated with the libraries, databases, and other program(s). 

9.   Implementation: This means installing the software on user machines. 

10.   Operation and Maintenance: This phase confirms the software operation in terms of more efficiency and less errors. 

>   Waterfall Model

Waterfall model is the simplest model of software development paradigm. This model assumes that everything is carried out and taken place perfectly as planned in the previous stage and there is no need to think about the past issues that may arise in the next phase. This model does not work smoothly if there are some issues left at the previous step. The sequential nature of model does not allow us to go back and undo or redo our actions. 

This model is best suited when developers already have designed and developed similar software in the past and are aware of all its domains. 

>   Interactive Model

This model leads the software development process in iterations. The software is first developed on very small scale and all the steps are followed which are taken into consideration. Then, on every next iteration, more features and modules are designed, coded, tested, and added to the software. Every cycle produces a software, which is complete in itself and has more features and capabilities than that of the previous one. After each iteration, the management team can do work on risk management and prepare for the next iteration. Because a cycle includes small portion of whole software process, it is easier to manage the development process but it consumes more resources. 

>   Spiral Model

Spiral model is a combination of both, iterative model and one of the SDLC model. 

This model considers risk, which often goes un-noticed by most other models. The model starts with determining objectives and constraints of the software at the start of one iteration. Next phase is of prototyping the software. This includes risk analysis. Then one standard SDLC model is used to build the software. In the fourth phase of the plan of next iteration is prepared.

>   V Model

The major drawback of waterfall model is we move to the next stage only when the previous one is finished and there was no chance to go back if something is found wrong in later stages. V-Model provides means of testing of software at each stage in reverse manner. 

At every stage, test plans and test cases are created to verify and validate the product according to the requirement of that stage. For example, in requirement gathering stage the test team prepares all the test cases in correspondence to the requirements. Later, when the product is developed and is ready for testing, test cases of this stage verify the software against its validity towards requirements at this stage. 

>   Big Bang Model

This model is the simplest model in its form. It requires little planning, lots of programming and lots of funds. This model is conceptualized around the big bang of universe. As scientists say that after big bang lots of galaxies, planets, and stars evolved just as an event. Likewise, if we put together lots of programming and funds, you may achieve the best software product. 

>    Big Bang Model 

This model is the simplest model in its form. It requires little planning, lots of programming and lots of funds. This model is conceptualized around the big bang of universe. As scientists say that after big bang lots of galaxies, planets, and stars evolved just as an event. Likewise, if we put together lots of programming and funds, you may achieve the best software product. 

# Project Management

A Software Project is the complete procedure of software development from requirement gathering to testing and maintenance, carried out according to the execution methodologies, in a specified period of time to achieve intended software product. 

It is an essential part of software organization to deliver quality product, keeping the cost within client’s budget constrain and deliver the project as per scheduled. 

>   Software Management Activities

1.   Project Planning: Software project planning is task, which is performed before the production of software actually starts. It is there for the software production but involves no concrete activity that has any direct connection with the software production; rather it is a set of multiple processes, which facilitates software production. Project planning may include the following: 

2.   Scope Management: It defines scope of the project; this includes all the activities, process need to be done in order to make a deliverable software product. Scope management is essential because it creates boundaries of the project by clearly defining what would be done in the project and what would not be done. This makes project to contain limited and quantifiable tasks, which can easily be documented and in turn avoids cost and time overrun. During Project Scope management, it is necessary to: 1. Define the scope; 2. Decide its verification and control; 3. Divide the project into various smaller parts for ease of management.
3.   Project Estimation: For an effective management, accurate estimation of various measures is a must. With the correct estimation, managers can manage and control the project more efficiently and effectively. Project estimation may involve the following: 1. Software size estimation; 2. Effort estimation; 3. Time estimation; 4. Cost estimation

Decomposition Technique: 1. Line of Code: Here the estimation is done on behalf of number of line of codes in the software product. 2. Function Points: Here the estimation is done on behalf of number of function points in the software product. 

Gantt Chart  

It is a horizontal bar chart with bars representing activities and time scheduled for the project activities. 

![Gantt Chart](https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/GanttChartAnatomy.svg/440px-GanttChartAnatomy.svg.png)

PERT(Program Evaluation & Review Technique) Chart

Events are shown as numbered nodes. They are connected by labeled arrows depicting the sequence of tasks in the project. 

![](https://www.productplan.com/uploads/Pert-Chart-Branded.png)

# Software Requirements

Requirements Engineering Process takes four steps: Feasibility Study; Requirement Gathering; Software Requirement Specification; Software Requirement Validation.

>   Requirement Elicitation Process

**Requirements gathering -** The developers discuss with the client and end users and know their expectations from the software. 

**Organizing Requirements -** The developers prioritize and arrange the requirements in order of importance, urgency and convenience. 

**Negotiation & discussion -** If requirements are ambiguous or there are some conflicts in requirements of various stakeholders, it is then negotiated and discussed with the stakeholders. Requirements may then be prioritized and reasonably compromised. 

The requirements come from various stakeholders. To remove the ambiguity and conflicts, they are discussed for clarity and correctness. Unrealistic requirements are compromised reasonably. 

**Documentation -** All formal and informal, functional and non-functional requirements are documented and made available for next phase processing. 

# Design Basics

