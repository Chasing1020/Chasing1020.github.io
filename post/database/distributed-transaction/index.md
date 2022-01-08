
按照需求对数据库的划分：

垂直划分：将某一个功能放到单独的数据库中，即AKF模型的Y轴；

水平划分：对库进行分库分表，即AKF模型中的Z轴。

## 1. Two Phase Commit

XA规范中定义的分布式事务模型包括四个组成部分：

-   RM（Resource Manager，资源管理器），负责管理分布式系统中的部分数据资源，保障该部分数据的一致性，满足规范要求的数据管理系统均可作为RM参与分布式事务，最典型的应用是数据库，如MySQL、Oracle、SQLServer等均支持该规范
-   TM（Transaction Manager，事务管理器），负责协调跨RM的全局事务的开启、提交和回滚
-   AP（Application Program，应用程序），通过TM定义事务边界，执行全局事务
-   CRM（Communication Resource Managers，通信管理器），负责全局事务过程中的跨节点通信

二阶段提交是一种强一致性的设计。设置一个中心的协调者（Coordinator，也称Transaction Manager，TM）与多个被调度的业务节点参与者（Participant，也称Resource Manager，RM）。

第一阶段（prepare）：TM向所有RM发送Prepare消息，每个参与者都执行事务

第二阶段（commit/rollback）：当事务管理者(TM)确认所有参与者(RM)都ready后，向所有参与者发送commit命令。
