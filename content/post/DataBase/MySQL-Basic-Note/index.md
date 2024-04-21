---
title: "MySQL Basic Note"
date: 2021-03-20T10:15:30+08:00
lastmod: 2021-03-20T10:15:30+08:00
draft: false
author: "Chasing1020"
comment: true
keywords: []
description: ""
tags: ['MySQl']
categories: ['Note']
image: "mysql.webp"
---

# MySQL基础笔记
## 1. 数据库简介
### 1.1.数据库的优势

使用数据库的优点

	实现数据持久化
	使用完整的管理系统，易于查询
	成本低，开源，性能高，使用简单
	移植性好

### 1.2.数据库的相关概念

	DB：（Database）即数据库本身，保存有组织数据的容器
	DBMS：（Database Manage System）数据库管理系统，即创建、使用数据库的系统
	SQL：（Structured Quey Language）结构化查询语言
	常用的数据库类型：MySQL，Oracle，DB2，SqlServer（只限win）

注意：SQL不是某个特定版本才有的，而是泛指一种结构化查询用的语言

### 1.3.存放数据

	先放到表中，再放到库中
	一个数据库可以有多个表，每个表有唯一标识
	表有一定特性，类似于java的类
	表中的列类似于java的对象的属性
	表中的行类似于java的对象本身

### 1.4.DBMS补充

一般有两类数据库：

- 基于文件共享管理系统的Access
- 基于C/S架构的MySQL


## 2. 数据库入门
### 2.1. 基础语法
#### 2.1.1. 启动/关闭数据库

	net start mysql
	net stop mysql

#### 2.1.2. 数据库的登录与退出

	在cmd命令行
	mysql -h localhost -P 3306 -u root -p123456 
	h代表host，P代表端口号，如果连接本机可以直接省略这个步骤
	退出：使用自带命令行，exit或者ctrl+c


#### 2.1.3. 常见语句举例

```mysql
# 1.查看当前数据库
show databases;
# 2.打开指定的数据库
use test;
# 3.查看当前库的所有表
show tables;
# 4.查看其他库的所有表
show tables from DB_; # 显示某表中的表，不切换数据库
# 5.创建表
create table 表名(
	列名 列类型,
	列名 列类型
);
# 6.查看表的结构
desc 表名;
# 7.查看MySQL版本(dos命令)
# mysql -V或者mysql --version
```

#### 2.1.4. 语法规范

	mysql 不区分大小写，但建议关键字大小写，表名和列名用小写
	每条命令最好用分号结尾，不然同时执行语句会出现语法错误
	可以根据需要换行或者使用缩进

注释：
	1. 使用 `# 注释内容`
	2. 使用 `-- 注释内容`   这里-- 后面有一个空格
	3. 使用 `/*注释内容*/`

### 2.2. DQL语言
Data Query Language

#### 2.2.1. 基础查询

关键词select 
```mysql
select 查询列表 from 表名;
```
类似于System.out.println()
查询的表可以是表中的字段，常量值，表达式，函数
查询以后的结果是一个虚拟的表格

举例
```mysql
SELECT last_name FROM employees;
SELECT `last_name`, `salary`, `email` FROM employees;
SELECT * FROM employees;
```
如果是关键字字段重合，如name，可以使用反斜点来标识一下变量名。

单引号和双引号都可以表示字符串。

字段名、表名通常不需要加任何引号，要加也是反引号。

查询常量值
```mysql
SELECT 123456;
SELECT 'chasing';
```
查询表达式
```mysql
SELECT 100%99;
```
查询函数
```mysql
SELECT VERSION();
```
起别名
```mysql
SELECT 100%99 AS 结果;
SELECT last_name AS 姓, first_name AS 名 FROM employees;
SELECT last_name 姓, first_name 名 FROM employees;
```
起别名的AS可以省略，如果别名是关键字类型，则需要使用双引号标注
```mysql
SELECT salary AS "OUT PUT" FROM employees;
```
去重
```mysql
SELECT DISTINCT department_id FROM employees;
```
+作用，仅仅只有运算符
```mysql
SELECT 1+'2' # 尝试转换为数值类型，即3
SELECT 1+'a' # 如果是非数值类型，则将数值转换为0
SELECT null+10 # 如果有null，则直接变为null
-- 以下方法是错误的
-- SELECT last_name+first_name AS 姓名 FROM employee; 
```
mysql里1+"2"：转为数值即3

java里1+"2"：转为字符型即"12"

python里1+"2"：Type Error 

CONCAT连接

```mysql
SELECT CONCAT(last_name, first_name) AS 姓名 FROM employee; 
# CONCAT 拼接含有null则拼接结果都是null
```
IFNULL判断非空
```mysql
select IFNULL(commission_pct, 0)
from employees;
```

#### 2.2.2. 条件查询

查询的列表可能有多种情况
基础语法

```mysql
select 查询列表
from 表名
where 筛选条件;
```
1.按照条件表达式筛选：
	条件运算符>  <  =  !=  <>  <=  >=  <=>

```mysql
select *
from employees
where salary>10000;
```
2.逻辑表达式
	&& || !
	and or not

以上方法都可以，但是更推荐使用下面的

```mysql
select salary
from employees
where salary>=10000 and salary<=20000;
```

3.模糊查询

主要有以下四种

- like
- between and
- in
- is null

like 一般和通配符搭配

% 任意多个匹配，0或者多个

_ 单个通配符，必须占位一个

\ 转义字符

```mysql
select *
from employees
where last_name like '%a%';
```

使用_

```mysql
select * 
from employees
# 查询第二个为_的名字，这里\ 被用作转义字符
where last_name like '_\_%';
```

对于转义字符，除了使用 \ 也可以自定义

```mysql
select * 
from employees
# 查询第二个为_的名字，这里a被用作自定义的转义字符
where last_name like '_a_%' escape 'a';
```

between and使用

```mysql
select *
from employees
where employee_id >= 100
  and employee_id <= 120;
```

可以改成

```mysql
select *
from employees
where employee_id between 100 and 120;
```
使用between and是包含临界值的，即闭区间，两个临界值不能颠倒

使用in
```mysql
select first_name,
       job_id
from employees
where job_id = 'IT_PROG'
or job_id = 'AD_VP'
or job_id = 'AD_PRES';
```
以上查询可以简写成in的形式
使用in可以提升简洁度，效率上没有提升（❌），in()会使用二分法查找，效率是O(logn)比or要好
在in的列表中不支持通配符

```mysql
select first_name,
       job_id
from employees
where job_id in ('IT_PROG', 'AD_VP', 'AD_PRES');
```

is null 
is 只能和null成对出现，即只有is null和is not null

```mysql
select last_name,
       commission_pct
from employees	
where commission_pct is not null;
```


安全等于
<=>
既可以判断null值，也可以判断普通的数值
但是使用较少，不便于区分，可读性较低

```mysql
select last_name,salary
from employees
where salary <=> 12000;
```

简单查询测试

```mysql
select last_name,
       department_id,
       salary*12*(1+ifnull(commission_pct, 0 )) AS 年薪
from employees;
```

#### 2.2.3. 排序查询

在查询的内容之后添加order by
asc 和 desc

```mysql
select *
from employees
order by salary asc;# 升序，从小到大，为默认值
```
以及
```mysql
select *
from employees
order by salary desc; #降序，从大到小
```


排序查询可以添加表达式
```mysql
select first_name,
       ifnull(1+commission_pct, 0)*12*salary
from employees
order by ifnull(1+commission_pct, 0)*12*salary desc;
```
也可以使用别名
```mysql
select first_name,
       ifnull(1+commission_pct, 0)*12*salary total
from employees
order by total desc;
```
按照多个字段排序，则整体以第一个字段为主要，后面的字段在前面的字段相同时再排序。

#### 2.2.4. 常用函数

隐藏实现细节，提高代码重用性

select 函数名() from 表名

分类
1. 单行函数
例如concat、length、ifnull

2. 分组函数
常用作统计处理

1、字符函数

| 函数名    | 作用                                          |
| :-------- | --------------------------------------------- |
| length()  | 获取字符串长度                                |
| concat()  | 拼接字符串                                    |
| upper()   | 全部改大写                                    |
| lower()   | 小写                                          |
| substr()  | 字符串截取                                    |
| instr()   | 返回字串的在主串的第一次位置索引，找不到返回0 |
| trim()    | 去除首和尾字符串空格或者是特定的字符          |
| lpad()    | 使用指定的字符填充左长度                      |
| rpad()    | 使用指定的字符填充右长度                      |
| replace() | 替换                                          |

对于中文字节长度，这里取决于编码，gbk是2个字节，utf-8是3个字节。

mysql字符串从1开始，这点需要特别注意。

二、数学函数
后加参数数字，一般都表示小数点后位数

| 函数名     | 作用                                        |
| ---------- | ------------------------------------------- |
| round()    | 四舍五入                                    |
| ceil()     | 向上取整                                    |
| floor()    | 向下取整                                    |
| truncate() | 截断                                        |
| mod()      | 取模，跟%一致（对于负数取余，计算a-a/b\*b） |
| rand()     | 返回0-1之间的随机数                         |

三 、日期函数

| 函数名        | 作用                       |
| ------------- | -------------------------- |
| now()         | 返回当前日期+时间          |
| curdate()     | 返回当前日期，不包含时间   |
| curtime()     | 返回当前时间，不包含日期   |
| str_to_date() | 将字符转换成日期           |
| date_format() | 将日期转换成字符           |
| datediff()    | 返回两个日期之间相差的天数 |

四、其他函数

| 函数名     | 作用                |
| ---------- | ------------------- |
| version()  | 返回版本号          |
| database() | 当前打开的数据库    |
| user()     | 返回当前的用户      |
| password() | 对输入的字符加密    |
| MD5()      | 采用md5加密后的结果 |


五、流程控制函数


if()三元运算符

case 条件表达式
when 常量1 语句1
when 常量2 语句2
else 语句n
end

或者
case 
when 条件 then 语句
when 条件 then 语句
else 语句n

六、分组函数

`所有分组函数都会忽略null值。`

sum()、avg()、max()、count()
可以在参数中添加distinct
count(\*)在任何行只要有非空元素，在这行就+1
count(1)统计原始表中所有的行数

#### 2.2.5. 分组查询

	select column, group_function(column)
	from table
	[where condition]
	[group by group_by_expression]
	[having after grouped]
	[order by column]

where 一定放在from后面

order by 一定放最后

分组后的条件，在最后查询到的结果后加having 
例如

```mysql
select max(salary), job_id
from employees
where commission_pct is not null
group by job_id
having max(salary) > 12000;
```

| where        | having       |
| ------------ | ------------ |
| 分组前筛选   | 分组后筛选   |
| 原始表       | 分组后的结果 |
| group by前面 | group by后面 |

分组函数做条件，那一定是用having
能用分组前筛选的就优先使用分组前筛选（提高性能）

多组查询
```mysql
select avg(salary),department_id,job_id
from employees
group by job_id, department_id;
```

#### 2.2.6. 连接查询

为了查询的限定，可以通过`表名.键名`来加以标识。
与sql92标准不同的是，sql99标准的数据库连接的条件放在on后面，where单独来放筛选的条件
而sql92的数据库连接条件和筛选条件都是放在where后面，用and连接
不管是92还是99，两者的效果是一样的，使用99更利于提升代码可读性。


@以下为sql92标准
一、等值连接

```mysql
select last_name,department_name
from employees,departments
where employees.department_id = departments.department_id; #连接条件
```
如果有n个表，则需要n-1个连接条件，中间使用and连接
对于多表的顺序没有要求
在以上查询过程种，from处的内容不能颠倒
为了简化查询的语句，可以使用别名，即可以在查询过程中使用别名。
但是使用了别名以后就不能再出现原名了。

二、非等值连接

跟以上都一样，只是where后面的条件变成不等式


```mysql
select salary, grade_level
from job_grades g,
     employees e
where salary between g.lowest_sal and g.highest_sal;
```
三、自连接
即表中的字段与自身存在匹配关系
方法：连接时建立两个别名

```mysql
select e1.last_name,e2.employee_id,e2.last_name
from employees e1,employees e2
where e1.manager_id=e2.employee_id;
```

@以下语法为sql99标准
语法

	select 查询列表
	from 表1 别名 
	[连接类型][inner] join 表2 别名
	on 连接条件
	where 筛选条件
	[group by 分组]
	[having 筛选条件]
	[order by 排序列表]

以上inner可以省略，但是不建议省略

等值查询
@sql99
一、内连接（集合的交集）

n个集合内连接需要n-1个条件。

```mysql
select last_name, department_name
from employees,
     departments
where employees.department_id = departments.department_id;
```
多表之间等值查询必须要有顺序，即join on 的内容有相关
```mysql
select last_name, department_name,job_title
from employees e
inner join departments d on e.department_id = d.department_id
inner join jobs j on e.job_id = j.job_id
order by department_name desc;
```
以上不能写为这种形式：（虽然没有报错，但是不符合规范）
```mysql
select last_name, department_name,job_title
from employees e
inner join jobs j on e.job_id = j.job_id
inner join departments d on e.department_id = d.department_id
order by department_name desc;
```


二、外连接（集合的差集）
外连接查询到的结果为主表和附表都有的字段，以及主表中有而在从表中没有的字段（这部分显示为null）
即：主有从有，主有从无
主表和从表分辨：

- 左外连接：left outer join左边是主表
- 右外连接：right outer join右边是主表

或者理解为：A left join B，就是A主表，集合为A-B
可以通过切换左右的顺序达到同样的效果

三、全外连接（集合的交集）
查询到两个表之间的交集	
全外连接查询到的结果为主表和附表都有的字段，以及主表中有而在从表中没有的字段（这部分显示为null），以及从表中有而在主表中没有的字段
即：主有从有，主有从无，从无主有
full outer join 全外连接

四、交叉连接（集合的笛卡尔积）
cross join 即代表笛卡尔乘积。这里跟sql92相同，所以使用较少。

#### 2.2.7. 子查询
子查询可以写在`其他语句`中的select语句，这里的`其他语句`也即表示可以用于增删改语句中。
在其他语句中的查询称为子查询
外部的查询称之为主查询（外查询）
位置可能出现的情况
子查询的位置可以放在select后面，where后面，having后面，或者是exists后面（相关子查询）。
按结果集的行列数不同。
查询结果：

- 标量子查询（一行一列，在select后面）
- 列子查询（一列多行，在where或者having后面）
- 行子查询（多行多列，在where或者having后面）
- 表子查询（以上都有，exists后面）

一、where及having后面
子查询一般放在小括号内，条件的右侧
1.标量子查询

```mysql
select *
from employees
where salary > (select salary
                from employees
                where last_name = 'Abel');
```
2.列子查询（多行子查询）
使用多行比较操作符，主要有以下几种

- in | not in
- any|some
- all

使用类比np库
```mysql
select *
from employees
where salary < (
    select MIN(salary)
    from employees
    where job_id = 'IT_PROG'
);
```
3.行子查询
由于很少有数据表满足这种情况，所以使用较少

```mysql
select *
from employees
where salary=(select max(salary)
from employees) and employee_id=(select min(employee_id)
from employees);
```
以上可以替换为
```mysql
select *
from employees
where (employee_id, salary) = (select min(employee_id), max(salary)
                               from employees);
```

二、select 后面

里面仅仅支持标量子查询（即只有一列）

```mysql
select d.*,
       (
           select count(*)
           from employees e
           where e.department_id = d.department_id
       )
from departments as d;
```

三、from后面

```mysql
select *
from (
         select avg(salary) ag, department_id
         from employees
         group by department_id
     ) ag_dep
         inner join job_grades g on ag_dep.ag
    between lowest_sal
    and highest_sal;
```

四、exist 后面（相关子查询）

由于能用exist的情况下一定能用in，所以使用较少
先使用外查询，再涉及子查询
exists后接完整查询语句，结果为1或者0
查询有员工的部门名
```mysql
select department_name
from departments d
where exists(select *
             from employees e
             where e.department_id = d.department_id);
```

#### 2.2.8. 分页查询

当要显示的数据再一页显示不全，需要提交多次sql请求
7  select 查询列表
1  from 表
2  [连接类型] join 表2 
3  on 连接条件
4  where 筛选条件
5  group by 分组字段
6  having 分组以后的筛选
8  order by 排序的字段
9  limit offset, size
前面的数字代表语句的执行顺序
这里offset是条目的起始索引，默认起始索引从1开始，如果是第一条，0可以省略
size是个数

```mysql
select * from employees limit 10,15;
# 查询第11到25条
```

假设需要显示的页数为page ，每一页的条目数是size
limit 语句都是在执行顺序的最后

使用特定数字进行查询



#### 2.2.9. 联合查询

union 联合查询

将多条查询语句合并成一个结果
查询某某条件或者某某条件的集合
```mysql
select last_name
from employees
where salary>10000 
or employee_id >50;
```
通过联合查询可以得到如下结果
```mysql
select last_name
from employees
where salary > 10000
union
select last_name
from employees
where employee_id > 50
```
作用，即同类型的数据存储在多个表中，如中国学生表和外国学生表，查询年龄大于18的。

适用于：搜索结果返回多个类型的表，但是查询的信息相同的情况，即列数要对应。
如果同样的字段出现在多个表中
union自带去重的效果，如果需要保存所有信息，需要增加union all



总结

7  select 查询列表
1  from 表
2  [连接类型] join 表2 
3  on 连接条件
4  where 筛选条件
5  group by 分组字段
6  having 分组以后的筛选
8  order by 排序的字段
9  limit offset, size




### 2.3.DML语言 

Dara Manipulation Language
数据操作语言
分为插入，修改，删除三大类

#### 2.3.1. 插入操作


方法一

	insert into 表名(列名1, ...) values(值1, ...)
	insert into 表名(列名1, ...) values(值1, ...), (值2, ...), ...

在插入的过程中，插入的值的类型要和列类型相一致或者兼容（能够隐式转换），列数的个数和值的个数一定要相匹配。
可以省略列名，默认所有的列，并且值的顺序需要和位置相一致

方法二

	insert into 表名
	set 元素1 = 值1, 元素2 = 值2, ...

方式一支持插入多行，方式二不支持插入多行，同时方式一支持子查询，方式二不支持

即方法一支持

insert into 表名
select 查询列表
from 表名

```mysql
insert into boys (boyName, userCP)
values ('zxa',10);
```

所以方法一使用教多

#### 2.3.2. 修改操作
一、修改单个表

1 update 表名
3 set 列1 = 新值1, 列2 = 新值2, ...
2 where 筛选条件;

语句的逻辑顺序132

二、 修改多个条件

同样分为92语法和99语法

@sql92语法中
update 表1 别名, 表2 别名
set 列 = 值
where 连接条件
and 筛选条件

@sql99语法中
update 表1 别名
[inner|left|full] update 表2 别名
set 列 = 值
where 筛选条件

#### 2.3.3. 删除操作

方式一：

	delete from 表名 where 筛选条件

删除的后面还可以添加limit作为补充，使用效果同查询部分

@sql92
delete 表1的别名, 表2的别名
from 表1 别名, 表2 别名
where 筛选条件
and 筛选条件;

@sql99语法
delete 表1的别名, 表2的别名
from 表1 别名
inner | left |right join 表2 别名 on 连接条件
where 筛选条件


方式二：truncate table 表名


[面试题]

1. truncate 一步实现删除整个表 不能添加where 不能实现多表删除
2. truncate 效率比delete效率高
3. 表中如果有自增长列，在使用delete删除以后，自增长的值会从断点开始
4. 如果使用truncate删除，则再插入数据，自增长列从1开始
5. truncate没有返回值，delete有返回值
6. truncate删除不能回滚，delete可以回滚事务


### 2.4.DDL语言
Data Define Language
数据定义语言

create，alter，drop等

#### 2.4.1. 库的管理

一、创建数据库
`create database 库名;`
为了提高容错性，可以将创建语句写为 
`crate database if not exists 库名;`

二、库的修改
修改名称
~~rename database 原名 to 新名;~~
这种方法现在已经被废弃，出于安全原因

一般不会轻易修改表名

修改字符集
`alter database 库名 character set 字符集名称;`

三、库名删除

`drop database if exists 库名`


#### 2.4.2. 表的管理
一、创建
create table 表名(
列名1  列的类型1  [(长度)约束],
列名2  列的类型2  [(长度)约束],
列名3  列的类型3  [(长度)约束]，
。。。
);

添加稳定性
create table if not exists 表名(
列名1  列的类型1  [(长度)约束],
列名2  列的类型2  [(长度)约束],
列名3  列的类型3  [(长度)约束]，
。。。
);

数据类型

	整型:
		typeint, 1字节
		smallint, 2字节
		mediumint, 3字节
		int(integer), 4字节
		bigint, 8字节

整型之间的区别只在于可以表示的范围，如果需要设置无符号，则需要在后面添加unsigned
如果超过了整型可以表示的范围，会报out of range 异常，并添加临界值
如果设置长度如int(7) zreo fill，同时该int类型会自动变为无符号类型，同时7代表长度不够7的情况下会用0填充
长度代表显示的最大宽度，无其他含义。

	小数
		浮点数类型：
			float，4字节
			double, 8字节
		定点数类型：
			dec(M, D), M+2字节 最大范围和double相同，有效位有M,D决定
			decimal(M, D), 

定义
float(M, D)
double(M, D)
dec(M, D)


M表示整数部分和小数部分合计的位数
后面的D表示小数点保留位数
如果插入超过临界值，则插入999.99（这里以5,2为例）

一般而言M, D都可以省略
如果师float和double 则会随着插入的数值而改变
如果是dec，则默认M为10, D为0

对于定点型，精度很高，对于插入数值的精度较高如货币运算可以考虑使用

对于使用的原则：所选择类型越简单越好，能保存数值的类型越小越好

	字符串
		较短的文本：
			char(M), 最多字符数是M，不是字节数，开辟空间时的长度固定，效率较高
			varchar(M),可变长度的字符，效率低于char
			binary,
			varbinarty,与上类似，存二进制类型
			enum(字段),如设置enum('男','女')那么在添加的时候只能添加这两种类型
			set(多个成员), 与enum类似，不过可以一次选取多个成员
		较长的文本：
			text
			blob

如果是存储季节如春夏秋冬，则使用char效率会高于varchar
char的长度M可以省略，默认为1，而varchar的长度M不可以省略

	日期类型：
		date,4字节，范围1000-9999
		datetime,8字节，范围1970-2038
		timestamp,4字节
		time,3字节
		year,1字节

timestamp插入的内容实际的时区有关，更能反应当前的时期，受mysql版本影响
datetime只能反映出插入时的当地时区
查询修改数据库的时区
show variables like 'time_zone'
set time_zone = '+9:00'


二、表的修改

修改列名
alter table 表名 change  column 原表名 新表名;

修改列的类型以及约束
alter table 表名 modify column 列名 约束类型;

添加新列
alter table 表名 add column 列名 约束类型;

删除列 
alter table 表名 drop column 列名;
alter table 表名 drop column if exists 列名;

修改表名
alter table 表名 rename to 新表名

三、表的删除

drop table 表名;
drop table id exists 表名

查看所有表
show tables;

四、 表的复制

仅仅复制表的结构：
create table 表名 like 原表名;

复制表的数据+结构：
create table 表名
select * from 原表名

只复制部分列或者部分行
create table 表名
select 查询的内容

只复制部分的内容作为表的结构
create table 表名
select 列名
from 原表名
where 1=2; # 或者直接写0

#### 2.2.3. 表的约束

约束用于限制表中的数据
为了保证添加到表中的数据可靠

一、not null
该字段的值不能为空
常用作学号，姓名

二、default
用于保证该字段有默认值比如性别

三、primary key
保证该字段具有唯一性，并且非空
比如学号

四、unique
保证该字段具有唯一性
比如座位号

五、check
在MySQL中不支持，但是不会报错
限制性别只有男和女
参数校验一般由后端来做

六、foreign key references
用于限制两个表之间的关系
保证该从表的字段值必须来自主表关联列的值
从表引用主表的值
show index from 表名	


------
在创建表时，修改表时都可以添加约束

	约束的类型：
		列级约束：六大约束都有效果，但是外键约束没有效果
		表级约束：除了非空和默认值，其余都支持

一般来说添加表级约束用constraint
语法
[constraint 约束名] 约束类型(字段名)

```mysql

create table student (
id int,
stuname varchar(20),
gender char(1),
seat int,
age int,
majorid int,

constraint pk primary key (id),
constraint uq unique(seat)
constraint ck check(gender = '男' or gender = '女'),
constraint fk_sudent_major foreign key(majorid) references major(id)
)
```

面试题
主键和唯一区别：
主键必定唯一，不允许为空。
可以设置联合主键：即只有多个列都完全相同才会报错，但是不推荐使用。

	外键要求
		在从表上设置外键关系：
		从表外键的列类型要和主表相一致或者兼容，对名称无要求
		要求主表的关联列必须是一个key，一般是主键或者唯一

修改约束类型
列级约束：
alter table 表名 modify column 列名 类型名 限定
表级约束：
alter table 表名 add primary key(列名)
删除约束：
alter table 表名modify column 列名 类型名 [null];
一般这个null可以省略不写





标识列：又称为自增长列
一个表只能有一个自增长列，且必须是数值类型
show variables like '%auto_increment%'
set auto_increment = 3 #修改步长
初始值直接插入一个特殊的值就行

### 2.5.TCL语言
Transaction Control Language 
事务控制语言
#### 2.5.1. 事务
一个或者一组sql语句组成一个执行单元，这个执行单元要么全部执行，要么全部不执行。

存储类型

[面试题]
事务ACID的特性：
1. 原子性(Atomicity)：事务是一个不可分割的工作单位，事务中的操作要么都发生，要么都不发生。
2. 一致性(Consistency)：事务必须使数据库从一个一致性状态切换到另一个一致性状态。
3. 隔离性(Isolation)：事物的隔离性是指一个事务的执行不能被其他事务干扰，即一个事务内部的操作及使用的数据对并发的其他事务是隔离的，并发执行的事务之间不能互相干扰。
4. 持久性(Durability)：持久性是指一个事务一旦被提交，它对数据库的改变就是永久性的，接下来的其他操作和数据库故障不应该对其有任何影响。

一、事务的创建
隐式：事务没有明显的开始和结束语句
比如update insert insert语句
```mysql
#前提必须先设置明显的开启和结束的标记
set autocommit = 0

# 开启事务的语句
start transaction

# 提交事务
commit

# 回滚事务
rollback
```
#### 2.5.2. 数据库的隔离级别

同时运行多个事务，对于两个事务，一个事务读取了另一个事务更新但是未提交的字段，如果这个事务回滚，那么原事务是无效的。

[面试题]
脏读：T1读取了T2已更新但是未提交的时段，如果T2回滚，则T1的数据无效。
不可重复读：T1读取了一个字段，但是T2把这个字段更新了，T1再读取该字段时数据发生了改变。
幻读：T1从表中读取了一个字段，然后T2在该表中插入了一些新的行，T1再读取的表就会多出几行

数据库的隔离问题
数据库有四种隔离级别：


	READ UNCOMMITED
		允许事务读取未被其他事务提交的变更，三种问题都会出现
	READ COMMITED
		只允许读取已经被提交的变更，可以避免脏读，但是不可避免不可重复读和幻读
	REPEATABLE READ（默认）
		确保事务可以多次从一个字段中读取相同的值，可以避免脏读和不可重复读，但是不可避免幻读
	SERIALIZABLE
		确保事务可以从一个表中读取相同的行，事务持续时间禁止其他事务对该表执行插入，避免所有情况，效率极低


查看当前的数据库隔离级别
select @@tx_isolation;

savepoint 节点名;
设置事务的保存点

rollback 节点名;
将事务回滚到保存点处

#### 2.5.3.视图

虚拟表和普通表一样使用

一种虚拟存在的表，行列的数据来自定义视图查询中所使用的表，是动态生成的，只保留sql逻辑，不保留查询的结果

语法
`create view 视图名 as 查询语句`

好处：

1. 重用复杂的sql语句
2. 简化了sql的操作，不必知道查询的细节
3. 保护数据，提高安全性

视图的修改
`create or replace view 视图名
as 查询语句`

或者使用
`alter view 视图名
as 查询语句`


删除视图
`drop view 视图名，视图名，……`

查看视图
`desc 视图名;`

[美团2019秋招笔试]
具有以下关键字的视图不允许更新：
聚合函数（SUM(), MIN(), MAX(), COUNT()等）。
DISTINCT
GROUP BY
HAVING
UNION或UNION ALL
位于选择列表中的子查询
Join
FROM子句中的不可更新视图
WHERE子句中的子查询，引用FROM子句中的表。
仅引用文字值（在该情况下，没有要更新的基本表）。
ALGORITHM = TEMPTABLE（使用临时表总会使视图成为不可更新的）。

视图虽然可以更新，但是最好不要更新，如果没有全面考虑在视图中更新数据的限制，就可能会造成数据更新失败



### 2.6. 变量

	系统变量
		全局变量
		会话变量
	自定义变量
		用户变量
		局部变量

系统变量：由系统提供，属于服务器层面

show global|session variables

查看满足条件的部分系统变量

show global variables like '%char%'

查看指定的某个系统变量的值
select @@global|session.系统变量名

为某个系统变量赋值
set @@global|session.系统变量名 = 赋的值


二、会话变量
仅仅针对当前会话有效
使用方法与上相同，把global换成session

三、自定义变量
作用域也仅仅针对于当前的会话，同于会话变量的作用域，针对当前变量有效
声明或者是赋值：
```mysql
set @用户变量名 = 值;
set @用户变量名 := 值;
select @用户变量名 := 值;
```
用户的自定义变量名为弱类型
赋值也可以使用

```mysql
select 字段 into @变量名
from 表;
```
四、局部变量
只能放在begin，end中

声明和赋值
declare 变量名 数据类型 [default 值];

declare 变量名 数据类型(值);

| 用户变量               | 局部变量                    |
| ---------------------- | --------------------------- |
| 当前会话               | begin end中间               |
| 会话中任何地方都可以用 | 只能在begin end中且为第一句 |
| 一般加@，弱类型        | 不需要加@，强类型           |



### 2.7. 流程控制函数

存储过程：一组预先编译好的sql语句集合。

提高代码的重用性，简化操作，减少连接服务器的次数
```mysql
create procedure pro_name(参数列表)
begin
    一组sql语句
end $;
```
在参数列表种，in作为输入，out作为输出，inout既可以输入也可以输出
存储过程的结尾可以使用
delimiter 结束标记

调用call pro_name()

删除 drop procedure pro_name



函数创建
create function 函数名(参数列表) return 返回类型
begin
	
end

函数体种肯定会有return语句


流程控制结构

	顺序结构
	分支结构
	循环结构


if(表达式1，表达式2，表达式3)

case 变量|表达式|字段
when 判断值 then 返回的值;
when 判断值 then 返回的值;
。。。
else
end case;


case
when 判断条件 then 返回的值;
when 判断条件 then 返回的值;
。。。
else 
end case;



if 条件1 then 语句1;
elseif 条件2 then 语句2;
。。。
[else 语句n;]
end if;


循环结构
iterate 类似于 continue

[标签] loop
   循环体
end loop [标签]
