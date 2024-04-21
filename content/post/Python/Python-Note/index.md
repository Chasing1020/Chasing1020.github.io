---
title: "Python Note"
date: 2020-10-06T15:53:09+08:00
lastmod: 2020-10-06T15:53:09+08:00
draft: false
author: "Chasing1020"
comment: true
keywords: []
description: ""
tags: ['Python']
categories: ['Language']
image: "python.webp"
---

# 第一章——基础知识


## 1、模块的引入


```python
#demo：
# 随机数

#导入import 模块

import random 

a=random.randint(1,5)

#a最终被赋值为1，2，3，4，5之间的随机一个数，左闭右闭

#这里包括1和5！
```





## 2、数据类型
```python
#type() 获取信息

#例如
a='520.0'
b=float(a)
type(a)#输出<class 'str'>
type(b)#输出<class 'float'>

#函数isinstance(var,class)
#对比前后类型
isinstance(10,int)#输出True
```
---
*强制类型转换*

- 不同于C/C++的(int)a和(double)b

- py中的强制类型转换的括号框住表达式

- 改为 int(a)和float(b)



## 3、符号运算

|  +   | 加                                                          |
| :--: | :---------------------------------------------------------- |
|  -   | 减                                                          |
|  \*  | 乘                                                          |
|  /   | 除，会自动转换为浮点类型，与C/C++不同                       |
|  %   | 取余                                                        |
| \*\* | 幂运算，等同于计算器中的^，结果为浮点型或整形，根据结果而定 |
|  //  | 带余除法，就算是浮点型运算也会保留整数部分，例如3.0//2=1.0  |






## 4、逻辑运算

| and  | 与   |
| ---- | ---- |
| or   | 或   |
| not  | 非   |



*三目运算符*

- a= 语句1 if 条件 else 语句2

例如: 

```python
a=x if x<y else y
#a赋值为x,y中小的那个
```


## 5、其余函数

assert: 同C/C++的asset(断言)

>- 同C/C++一样
>- assert 1>2
>- 结果为False，程序直接终止



# 第二章——循环

## 1、for循环
``` python
#for循环

name = "chasing"

a = ["aa", "bb", "cc", "dd"]

for i in range(5):

  #5表示结束，[0,5)，左闭右开

  print(i,end="")#end=""表示不换行，在循环结束以后不执行任何操作

  #输出01234

for i in range(1, 10):

  #从1到10，[1,10)，但是不会包括10，左闭右开

  print(i,end="")

  #输出123456789

for i in range(0, 100, 10):#for(int i=0;i<100;i+=10)

  #从1到100，每次i增加10，但是不会包括100，直到100跳出循环，左闭右开

  print(i,end="，")

  #输出0，10，20，30，40，50，60，70，80，90，

for i in name:

  #遍历字符串

  print(i,end="")

  #输出chasing

for i in range(len(a)):

  #遍历每一个列表

  print(a[i], end=",")

  #输出aa,bb,cc,dd,

```




## 2、while循环
```python
#while循环

count=0

while count<5:

  print(count,"小于5")

  count+=1

  if count>3:

    break

else:#只要进入while循环，正常出来，或者没有进入while循环，则else写不写都一样

  #触发else 的唯一情况就是while里面有break且被执行，for同理

  print(count,"大于或等于5")

```





## 3、break和continue

| break    | 跳出循环                                          |
| -------- | ------------------------------------------------- |
| continue | 跳过当前循环                                      |
| pass     | 占位语句，相当于C/C++的;（空语句）， 不做任何事情 |

>样例1
```python
#输出2019到2100第一个闰年

for i in range(2019,2100):

  if (i%4==0) and (i%100!=0) or (i%400==0):
    
    break

print("2019-2100第一个闰年是%d"%i)

#2019-2100第一个闰年是2020
```


>样例2
```python

#打印99乘法表

for i in range(1,10):

  for j in range(1,i+1):

    print("%d*%d=%d"%(i,j,i*j),end=" ")

  print("\n")

```



# 第三章——字符串

注意，python3默认是utf-8编码。字符串都是unicode字符串。

字符串可以使用单引号，双引号，三引号（三个单引号，三个双引号）


```python
word='zifu'
sentence ="juzi"
paragraph="""

  duan

  luo

"""
#"""  """保存原始的所有格式

print(word)

print(sentence)

print(paragraph)
```



双引号""里面没有转义字符，但是可以使用 '，即str="I'm a boy"，这里的'm不会报错

而使用单引号，则需要str ='I\\'m a boy'



## 1、截取、切片
```python
my_str="shu_chasing"

print(my_str)

print(my_str[0:3])#输出shu

print(my_str[1:11:2])#输出h_hsn

#[起始位置:结束位置:步进值]，这里也是不包括11在内

print(my_str[6:])#输出从第6个到结尾，即asing，这里不包括第6个

print(my_str[:6])#输出从第一个到第6个，即shu_ch

print(my_str+",nihao")#输出shu_chasing,nihao

print(my_str*3)#输出shu_chasingshu_chasingshu_chasing

```


## 2、转义字符
```python
#使用、实现转义字符的功能

mystring=r'c:\now'

print(mystring)
#输出就是c:\now，去掉前面的r则会出现换行

#在字符串前面加上r表示原始字符串，不会翻译转义字符

#字符串不能以\结尾

```
## 3、字符串常用函数
### 1.大写转小写casefold

```python
str='SHU_chasing'
str=str.casefold()
print(str)#shu_chasing
```

### 2.第一个转大写capitalize
```python
str='shu_chasing'
str=str.casefold()
print(str)#Shu_chasing
```

### 3.查找find
>函数原型find(sub[,start[,end]])
>可以选择范围
>也可以不写范围搜索全部

```python
str='shu_chasing'
print(str.find('s'))           #输出0
print(str.find('s', 3 ,10))    #7
```

### 4.统计数目count
>函数原型count(sub[,start[,end]])
>可以选择范围
>也可以不写范围搜索全部

```python
str='shu_chasing'
print(str.count('s'))           #输出2
print(str.count('s', 3 ,10))    #输出1
```
### 5.替换replace
>函数原型replace(old, new[,count])
>将old的字符串转换为指定的字符串
```python
str='I love math'
str=str.replace('math','programming')
print(str)    #输出I love programming
```

### 6.拆分split
split(sep=None, maxsplit=-1)

```python
str='D:\software\python'
str=str.split(sep='\\')        #注意这里是两个\\
print(str)        #输出['D:', 'software', 'python']，转为列表类型
```
### 7.拼接join
>不能写成str.join('\\')
>join被指定为字符串其中的一个用法
>join的参数支持一切可以迭代的对象（列表，元组，字典，文件，集合，生成器）
>推荐使用join替代加号拼接
>+会频繁进行内存复制和触发垃圾回收机制
```python
str=['D:', 'software', 'python']
str='\\'.join(str)    #转义字符
print(str)              #D:\software\python
str=['D:', 'software', 'python']
str=''.join(str)
print(str)        #输出D:softwarepython
```

# 第四章——列表list[ ]


>- 1.非常类似于数组

>- 2.可以同时使用字符串，整形，浮点型等等

>- 3.可以为负数下标

>- 4.可以嵌套，类似二维数组


## 1、遍历列表

```python
#namelist=[] #定义空列表

namelist=["xiaozhang","2.3","10"]#可以为不同类型的变量，储存混合类型

print(namelist[0])

print(namelist[1])

print(namelist[2])


for i in range(0,3):

  print(namelist[i])

for i in range(-2,0):#输出最后两个元素

  print(namelist[i])

for i in namelist:

  print(i)


print(len(namelist))#输出长度

i=0

while i<len(namelist):

  print(namelist[i])

  i+=1#不能写i++

```

## 2、数据操作
### 1. append增加

```python
namelist=["xiaozhang","2.3","10"]#可以为不同类型的变量，储存混合类型

for i in namelist:
    print(i)

#增加

nametemp=input("请输入添加的数据")
namelist.append(nametemp)
for i in namelist:

    print(i)

#输出结果多了append的内容["xiaozhang","2.3","10", ____]
```
>#特别的，使用乘法
>a=[1]
>a=a*3
>#最后a就是[1, 1, 1]

### 2. append和extend区别
```python
#append和extend的区别

a=[1,2]

b=[3,4]

a.append(b)

print(a)

#结果为[1,2,[3,4]]，将一个列表作为整个整体，加入列表中

a.extend(b)

print(a)

#结果为[1,2,[3,4],3,4]，将b列表中的每一个，逐一加入列表中
```

### 3. insert用法
```python
#insert用法

a=[0,1,2]

a.insert(1,200)#第一个表示下标，第二个表示元素

print(a)#结果为0,200,1,2

```
### 4. del删除
```python
#del删除

a=[0,10,20,30,10,40,50]#可以出现重复数据

print(a)

del a[2]#删除指定下标的元素

print(a)#结果为[0, 10, 30, 10, 40, 50]

a.pop()#弹出末尾最后一个元素

print(a)#结果为[0, 10, 30, 10, 40]

a.remove(10)#删除第一个值为10的元素

print(a)#结果为[0, 30, 10, 40]


#[]修改

b=["chasing"]

b[0]="shu_chasing"#直接修改就可以了
```
### 5. index查找与count计数
```python
a=[0,10,20,30,10,40,50]
findname=int(input("请输入想找的元素"))#记得修改为整数型
if findname in a:
  print("找到了一样的元素")
else:
  print("没有找到相同的元素")
#index查找
a=[0,10,20,30,10,40,50]
print(a.index(10,1,4))#返回下标1，在1-3范围内查找元素10，这个范围左闭右开——[1,4)
print(a.index(10,1,7))#返回第一个出现的下标1，在1-6范围内查找元素10，这个范围左闭右开——[1,7)
#count计数
print(a.count(10))#统计查找的元素出现了几次
```

> list.index(item)        #从头到尾找
>
> list.index(item, start, end)    #在开始和结束之间找

### 6.reverse反转和sort排序

```python
#反转和排序
a=[1,4,2,3]

print(a)#输出[1, 4, 2, 3]

a.reverse()

print(a)#输出[3, 2, 4, 1]

a.sort()

print(a)#输出[1, 2, 3, 4]

a.sort(reverse=True)

print(a)#输出[4, 3, 2, 1]

```





## 3、列表的嵌套
> 类似于二维数组

```python
a=[[10,20],[40,50],[30,60,70]]
print(a[0])#输出[10, 20]
print(a[1][0])#输出40

#test
import random
offices=[[],[],[]]
names=[1,2,3,4,5]
for name in names:
    index= random.randint(0,2)
    offices[index].append(name)
i=1
for office in offices:
    print("办公室%d的人数是：%d"%(i,len(office)))
    i+=1
    for name in office:
        print("%s"%name,end='t')
    print("n")
#以下是随机结果

#办公室1的人数是：0
#办公室2的人数是：2
#1
#5
#办公室3的人数是：3
#2
#3
#4    
```
>sort默认是归并排序
>实际上, sort有三个参数
>sort(func, key, reverse)

# 第五章——元组tuple( )
## 1、创建
>tuple(元组)
>- 与list类似，不同处在于tuple不能修改元素，
>- 写在小括号里，元素之间用逗号隔开
>- 元素不可变，但是包含可变对象
```python
t1=(2.33,'abcd',786,)
t2=(1,)
t3=('a','ab',['a',2.3])
print(t1)    #(2.33, 'abcd', 786)
print(t2)    #(1,)
print(t3[2][1])     #2.3
```
如果创建空的元组
```python
tup1=()        #空的元组
tup2=(50)    #整形
tup3=(100,)        #含有一个元素的元组，如果只有一个，则需要加逗号,在这里也可以写tup3=100,
#可以不需要小括号，但是一定要逗号
tup4=(150,200)    #含有多个元素的元组
print(type(tup1))
print(tup2)
print(type(tup2))
print(tup3)
print(type(tup3))
print(tup4)
print(type(tup4))

#<class 'tuple'>
#50
#<class 'int'>，这里不加，就是整形
#(100,)
#<class 'tuple'>
#(150, 200)
#<class 'tuple'>
```
## 2、遍历与切片

```python
tup1=("abc",10,23.4)

print(tup1)        #输出('abc', 10, 23.4)

print(tup1[-1])        #输出23.4

print(tup1[0:2])# 输出('abc', 10)，这里只有[0,2)，即[0,1]，左闭右开
```

## 3、增加
```python
tup1=(12,34,56)
#tup[1]=100
#报错，不能修改tup的值，'tuple' object does not support item assignment
```
- 不能“新增”
- 只能设置新的变量
- 分配新的空间
```python
tup1=(12,34,56)
tup2=('a','b','c')
tup3=tup1+tup2
print(tup3)#(12, 34, 56, 'a', 'b', 'c')
```

## 4、删除
```python
tup1=(12,34,56)
print("删除前")
print(tup1)
del tup1#删除了整个元组变量，可以完成，以后不能访问tup1
#print("删除后")
#print(tup1)
#报错，不能访问tup1的内容，name 'tup1' is not defined
#del tup[1]
#报错，不能删除某一个下标，'tuple' object doesn't support item deletion
```
## 5、基本操作
| 操作名称         | 操作方法 | 举例          |
| ---------------- | -------- | ------------- |
| 元素成员关系     | in       | 2 in list1    |
| 得到重复元素数量 | count    | tup1.count(1) |

| 操作名称         | 操作方法         | 举例                        |
| ---------------- | ---------------- | --------------------------- |
| 访问元组中的元素 | 通过下标直接访问 | print(tup[10])              |
| 遍历元组         | 通过for循环      | for i in tup:    print(i)   |
| 元组的切片       | 使用[ :  : ]     | tup[2:10:1]，[::-1]表示倒序 |
| 元组的加法操作   | +                | tup3=tup1+tup2              |


## 6、基本函数

| 函数名称           | 操作方法 | 备注                             |
| ------------------ | -------- | -------------------------------- |
| 获取数组长度       | len()    | len(tup)-1就是最后一个元素的下标 |
| 获取元组元素最大值 | max()    |                                  |
| 获取元组元素最小值 | min()    |                                  |
| 强制类型转换       | tuple()  |                                  |
| 获取随机元素       | choice() | 加上import random 模块           |

## 7、字符串操作
>*同元组一样，字符串也是不能被修改的
>如果必须修改，则需要使用切片和拼接
```python
str="cgasing"

str=str[:1]+"h"+str[2:]#修改第二个

print(str)#输出chasing
```
# 第六章——序列
## 1、总结

列表、元组、字符串的共同点

>可以通过索引得到每一个元素
>默认索引从0开始
>可以切片得到范围内的集合
>有共同操作符（重复、拼接、成员）
>*以上统称为——序列*
## 2、操作函数
| 函数名                                  | 作用                                   | 示例             |
| --------------------------------------- | -------------------------------------- | ---------------- |
| list([iterable])                        | 强制将可迭代对象转换为列表             | a=list((1,2,3))  |
| tuple([iterable])                       | 强制将可迭代对象转换为元组             | a=tuple((1,2,3)) |
| str(obj)                                | 强制将对象转换为字符串                 | a=str(10)        |
| len(sub)                                | 返回sub参数长度                        | len(str1)        |
| max()                                   | 返回参数集合最大值                     | max(list)        |
| min()                                   | 返回参数集合最小值（保证数据类型统一） | min(list)        |
| sum(iterable[, start])                  | 返回所有元素值的总和                   | sum(list,5)      |
| sorted(iterable,key=None,reverse=False) | 返回排序后的列表                       | sorted(list)     |
| reversed(sequence)                      | 返回逆向迭代序列的结果                 | reversed(list)   |
| enumerate(iterable)                     | 生成一个二元组构成的一个迭代对象       | 见下文           |
| zip(iter1[,iter2[...]])                 | 返回各个可迭代参数共同组成的元组       | 见下文           |

enumerate用法，可以单独理解为枚举
```python
#enumerate
str='chasing'
for i in enumerate(str):
    print(i)
for i,j in enumerate(str):
    print(i,j)
#(0, 'c')
#(1, 'h')
#(2, 'a')
#(3, 's')
#(4, 'i')
#(5, 'n')
#(6, 'g')
# 0 c
# 1 h
# 2 a
# 3 s
# 4 i
# 5 n
# 6 g
```

zip用法
```python
list1=[1,7,3,5,6]
str1="chasing"
turple1=(2,4,6,8,10)
for i in zip(list1, str1, turple1):
    print(i)
#(1, 'c', 2)
#(7, 'h', 4)
#(3, 'a', 6)
#(5, 's', 8)
#(6, 'i', 10)
```
# 第七章——字典 { }

## 1、字典dict定义
>字典，即散列表
>
>是无序对象的集合，使用键-值(key-value)存储，具有极快的速度
>
>查找，插入、删除都为O(1)复杂度
>
>键(key)必须使用不可变类型
>同一个字典的key是唯一的
>类似于json的对象，C++的map，数据结构的红黑树，哈希表

```python
#字典的定义
info = {"name":"chasing","age":"18"}
print(info["name"])    #输出chasing
print(info["age"])    #输出18
#print(info["gender"])
#错误，KeyError: 'gender'

#直接访问
print(info.get("gender"))    
#输出None，没有找到默认返回None
print(info.get("gender","not found"))    #修改默认的值
#输出not found，没有找到返回not found
```

## 2、添加
```python
info = {"name":"chasing","age":"18"}
newID=input("请输入新的学号：")
info["ID"]=newID
print(info["ID"])
```
## 3、删除
```python
info = {"name":"chasing","age":"18"}
print("删除前：%s"%info["name"])
del info["name"]
#使用del info则删除整个字典
#print("删除后：%s"%info["name"])#删除后键值对后，再次访问就会报错
#报错KeyError 'name'
```

## 4、清除
```python
info = {"name":"chasing","age":"19"}
print("删除前：%s"%info)    #删除前：{'name': 'chasing', 'age': '18'}

info.clear()                   #只是清空
print("删除后：%s"%info)    #删除后：{}
```

## 5、修改
```python
info = {"name":"chasing","age":"19"}
info["age"]=20
print(info["age"])    #输出20

```

## 6、查找
```python
info = {"name":"chasing","age":"18","id":19120397}
print(info.keys())        #得到所有的键dict_keys(['name', 'age', 'id'])
print(info.values())     #得到所有的值dict_values(['chasing', '18', 19120397])
print(info.items())        #得到所有的项dict_items([('name', 'chasing'), ('age', '18'), ('id', 19120397)])
#每个键值对都是元组
```

## 7、遍历所有的键、值、项
```python
info = {"name":"chasing","age":"18","id":19120397}
for i in info.keys():
    print(i)
for i in info.values():
    print(i)
for i,j in info.iems():
    print("%s\t%s"%(i,j))
# name
# age
# id
# chasing
# 18
# 19120397
# name    chasing
# age     18
# id      19120397
    
```

# 第八章——集合 { }
## 1、定义
>set和dict类似，也是key的集合，但是不储存value
>同C++一样，set不能存相同的元素，重复元素自动过滤
>但是不同的是，set是无序的
>操作方法与其他相同
>for、update、add、remove、pop、clear、del等等

```python
s=set([1,2,3])
print(s)    #输出{1, 2, 3}
s=set([1,2,3,2,2,1,1,1,3,1,3,3])
print(s)    #输出{1, 2, 3}
```
## 2、小结

|            | 是否有序 | 是否可变类型         |
| ---------- | -------- | -------------------- |
| **列表[]** | 有序     | 可变类型             |
| 元组()     | 有序     | 不可变类型           |
| **字典{}** | 无序     | key不可变，value可变 |
| 集合{}     | 无序     | 可变类型，不重复     |

```python
a = set('abracadabra')
b = set('alacazam')

print(a)

print(a - b)     # a 和 b 的差集

print(a | b)     # a 和 b 的并集

print(a & b)     # a 和 b 的交集

print(a ^ b)     # a 和 b 中不同时存在的元素
```
# 第九章——函数
提高编码效率，减少重复
## 1、定义

1. 定义方式：
```python
def func():
    code
    return val
```
2. demo：

```python
def printname():
    print("chasing")
printname()        #输出chasing
```

## 2、带参数函数
```python
def add(a,b):
    c=a+b
    print(c)
add(1, 2)     #输出3
```
## 3、带返回值函数
1. 返回单个值

```python
def add(a,b):
    c=a+b
    return c
print(add(1,2))        #输出3
```
2. 返回多个值
	和lua相同

```python
def divid(a,b):
    shang=a//b    
    yushu=a%b
    return shang,yushu        #多个返回值用逗号分隔
sh,yu=devid(5,2)
print("商：%d，余数：%d"%(sh,yu))        #输出商：2，余数：1
```
3. 局部变量和全局变量
	<1>在函数内的作为局部变量
	<2>在函数外定义的为全局变量

```python
a=5
def test1():
    a=10    #优先使用全局变量
    print(a)
    a=200
    print(a)
def test2():
    print(a)
test1()
test2()
# 10
# 200
# 5
```
4. 在函数中的使用全局变量

```python
a=5
def test1():
    global a=10    #添加global
    print(a)
    a=200
    print(a)
def test2():
    print(a)
test1()
test2()
# 5
# 200
# 200
```
# 第十章——拷贝
## 1、元组默认深拷贝
> 直接赋值：其实就是对象的引用（别名）。
> 浅拷贝(copy)：拷贝父对象，不会拷贝对象的内部的子对象。
> 深拷贝(deepcopy)： copy 模块的 deepcopy 方法，完全拷贝了父对象及其子对象。
```python
import copy

tuple1 = (1, 2, 3)
tuple2 = tuple(tuple1)
print(tuple2)
print("tuple1==tuple2 ?",tuple1==tuple2)
print("tuple1 is tuple2 ?",tuple1 is tuple2)

tuple3 = copy.copy(tuple1)
print(tuple3)
print("tuple1==tuple3 ?",tuple1==tuple3)
print("tuple1 is tuple3 ?",tuple1 is tuple3)

tuple4 = tuple1[:]
print(tuple4)
print("tuple1==tuple4 ?",tuple1==tuple4)
print("tuple1 is tuple4 ?",tuple1 is tuple4)
#(1, 2, 3)
#tuple1==tuple2 ? True
#tuple1 is tuple2 ? True
#(1, 2, 3)
#tuple1==tuple3 ? True
#tuple1 is tuple3 ? True
#(1, 2, 3)
#tuple1==tuple4 ? True
#tuple1 is tuple4 ? True
```
## 2、地址类型的传递
 Python中对象的赋值都是进行对象引用（内存地址）传递
 使用copy.copy()，可以进行对象的浅拷贝，它复制了对象，但对于对象中的元素，依然使用原始的引用.
 如果需要复制一个容器对象，以及它里面的所有元素（包含元素的子元素），可以使用copy.deepcopy()进行深拷贝
 对于非容器类型（如数字、字符串、和其他'原子'类型的对象）没有被拷贝一说
