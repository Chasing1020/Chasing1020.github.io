---
title: "Data Analyzation Note"
date: 2020-10-25T19:13:09+08:00
lastmod: 020-10-25T19:13:09+08:00
draft: false
author: "Chasing1020"
comment: true
keywords: []
description: ""
tags: ['Data Analyzation']
categories: ['Note']
image: "numpy.webp"
---

# 创建数组对象

## 一维数组

```python
name=np.array(['1','2','3','4','5','6'])
print(name.ndim)#维数
print(name.size)#大小
```

## 二维数组

1. 创建

```python
import numpy as np
name=np.array([['1','2','3','4','5','6'],['1','2','3','4','5','6'],['1','2','3','4','5','6'],['1','2','3','4','5','6']])
```

2. 查看属性

```python
print(name.ndim)#维数，也可以说是矩阵的秩
print(name.size)#大小
print(name.shape)#行数和列数
print(name.dtype)#查看数据类型
```

3. 访问下标

```python
print(name[2])#索引为[0,n-1]
print(name[-3])#索引为[-n,-1]，表示倒数
```

4. 切片(slicing)

```python
for i in name[[1,2],[2,4]]:#表示下标1，2和下标2，4#如果使用:，则表示所有的行和列
    print(i)
for i in name[1:2,2:4]:#表示下标1，2和下标2，4#如果使用:，则表示所有的行和列
    print(i)
```

5. 条件筛选

```python
print(name[(name==1)|(name==2)])
```

6. 创建多维数组

```python
a=np.arange(1,10,1)#生成1-9之间的连续的数组
a=np.arange(0,15).reshape(3,5)#将一维数组转为二维数组
a=np.zeros((3,4))#生成3*4的为0的数组
a=np.ones((4,3))#生成4*3的为1的数组
```

7. 多维数组运算

```python
a=np.ones((4,3))
a=a*5#生成全部为5的数组
a=a+3#生成全部为4的数组
```

## 常用函数、属性

1. 函数

| 函数                        | 作用                                   |
| --------------------------- | -------------------------------------- |
| np.array(列表)              | 通过列表创建一个数组对象               |
| np.arange(起始, 结束, 步长) | 创建一个等差数组(注意区间是左闭右开的) |
| np.zeros( (m, n) )          | 创建一个m行n列的全零数组               |
| np.ones( (m, n) )           | 创建一个m行n列的全一数组               |
| np.eye(m)                   | 创建一个m阶单位方阵                    |

2. 常用对象属性

| 属性                                                         | 作用                             |
| ------------------------------------------------------------ | -------------------------------- |
| my_array.ndim                                                | 维数                             |
| my_array.size                                                | 大小                             |
| my_array.shape                                               | 以元组形式返回my_array的(行, 列) |
| my_array.dtype                                               | 返回my_array中元素的数据类型     |
| *注意库函数和对象属性的不同，表一中np.是固定的，指的是numpy库；而表二中my_array.xxx()中的my_array要改成你对应的数组的名字（即实例名）。 |                                  |
| ## 切片                                                      |                                  |
| 切片                                                         |                                  |

>我们将选出一个数组的某一行、某一列或者某一个位置上的元素的操作成为“切片”
>我们先来讨论二维数组的切片:
>最基本的格式是：my_array[m, n]，其中m和n可以为整数 列表 还可以是冒号:
>当m和n是整数时，表示选取m行n列的那个数。
>当m和n其中一个是冒号的时候，表明选中对应的所有行或列。例如my_array[ :, n]表示选择整个第n列

```python
arr = np.arange(1,10).reshape(3,3)
print('切片前：')
print(arr)
m = [0,1]
n = [1,2]
print('切片后：')
print(arr[m, n])
'''
切片前：
[[1 2 3]
 [4 5 6]
 [7 8 9]]
切片后：
[2 6]
'''
```

## 通用函数func

1. 常用的一元函数

| 函数              | 描述                           |
| ----------------- | ------------------------------ |
| abs、fabs         | 计算整数、浮点数、复数的绝对值 |
| sqrt              | 计算平方根                     |
| square            | 计算平方                       |
| exp               | 计算指数                       |
| log、log10        | 计算自然对数、底数为10的log    |
| sign              | 计算正负号                     |
| ceil、floor       | 天花板、地板函数               |
| sin、cos、cosh... | 三角函数                       |

-----

2. 常用的二元函数

| 函数             | 描述                               |
| ---------------- | ---------------------------------- |
| add              | 将对应的元素相加                   |
| subtract         | 从第一个数组中减去第二个数组的元素 |
| multiply         | 数组元素相乘                       |
| divide           | 数组元素相除                       |
| power            | 计算幂次                           |
| mod              | 计算模                             |
| copysign         | 将第二个数组的符号赋值给第一个数组 |
| equal、not_equal | 执行元素比较，返回布尔类型的数组   |

3. 聚集函数

| 函数           | 描述                 |
| -------------- | -------------------- |
| sum            | 求和                 |
| mean           | 算数平均值           |
| min、max       | 最大值和最小值       |
| argmin、argmax | 最大值和最小值的索引 |
| cumsum         | 从0开始累加          |
| cumprod        | 从1开始累乘          |

4. 随机数组生成函数

| 函数        | 描述                                           |
| ----------- | ---------------------------------------------- |
| random      | 随机产生[0,1)                                  |
| randint     | 随机生成给定范围内的一组整数                   |
| uniform     | 随机生成给定范围内服从均匀分布的一组浮点数     |
| choice      | 在给定的范围内随机选择元素                     |
| normal      | 随机生成一组服从给定均值和方差正态分布的随机数 |
| ## 课后作业 |                                                |

```python
#P21
import numpy as np
names = np.array(['王微','肖良英',"方绮雯",'刘旭阳','钱易铭'])
subjects = np.array(['Math', 'English', 'Python', 'Chinese', 'Art', 'Database', 'Physics'])
scores = np.array([[70,85,77,90,82,84,89],[60,64,80,75,80,92,90],[90,93,88,87,86,90,91],[80,82,91,88,83,86,80],[88,72,78,90,91,73,80]])
#1.
#(1)
print(subjects[[1,2,4]])
print(names[-3])
#(2)
print(names[2:])
print(subjects[2:5])
#(3)
print(subjects[(subjects == 'English') | (subjects == 'Physics')])

#2.
#(1)
print(scores[[1,4],:])
#(2)
print(scores[[2,4]][:,(subjects == 'Python')|(subjects == 'Math')])
#(3)
print(scores[:,(subjects == 'English') | (subjects == 'Art')])
#(4)
print(scores[(names=='王微')|(names=='刘旭阳'),(subjects=='English')|(subjects=='Math')])

#3.
a=np.arange(10,20).reshape(2,5)
print(a)
'''
1. 一维数组访问。

1) 在 subjects 数组中选择并显示序号 1、 2、 4 门课的名称，使用倒序索引选择并显示 names 数组中“方绮雯“。
['English' 'Python' 'Art']
方绮雯

2) 选择并显示 names 数组从 2 到最后的数组元素；选择并显示 subjects 数组正序 2~4 的数组元素。
['方绮雯' '刘旭阳' '钱易铭']
['Python' 'Chinese' 'Art']

3) 使用布尔条件选择并显示 subjects 数组中的英语和物理科目名称。
['English' 'Physics']

2. 二维数组访问。

l) 选择并显示 scores 数组的 1、 4 行。 
[[60 64 80 75 80 92 90]
 [88 72 78 90 91 73 80]]

2) 选择并显示 scores 数组中行序 2、 4 学生的数学和 Python 成绩
[[90 88]
 [88 78]]
3) 选择并显示 scores 数组中所有学生的数学和艺术课程成绩。
[[85 82]
 [64 80]
 [93 86]
 [82 83]
 [72 91]]

4) 选择并显示 scores 数组中“王微”和“刘旭阳”的英语和艺术课程成绩。 
[[85 82]
 [82 83]]

3. 生成由整数 10~19 组成的 2x5 的二维数组。
[[10 11 12 13 14]
 [15 16 17 18 19]]
'''
```

```python
# 数据准备
#P26
import numpy as np
names = np.array(['王微','肖良英',"方绮雯",'刘旭阳','钱易铭'])
subjects = np.array(['Math', 'English', 'Python', 'Chinese', 'Art', 'Database', 'Physics'])
scores = np.array([[70,85,77,90,82,84,89],[60,64,80,75,80,92,90],[90,93,88,87,86,90,91],[80,82,91,88,83,86,80],[88,72,78,90,91,73,80]])
# 第一题
print('1. 将 scores 数组中所有学生的英语成绩减去 3 分并显示。 ')
print(scores[:, subjects == 'Art'] -3)
# 第二题
print('\n2. 统计 scores 数组中每名学生所有科目的平均分并显示。 ')
for i in range(0,5) :
    print(scores[i].mean())
# 第三题  
print('\n3. 使用随机函数生成[-1,1]之间服从均匀分布的 3x4 二维数组，并计算所有元素的和。')
uni = np.random.uniform(-1,1,(3,4))
print(uni)
print(uni.sum())
'''
1. 将 scores 数组中所有学生的英语成绩减去 3 分并显示。 
[[79]
 [77]
 [83]
 [80]
 [88]]

2. 统计 scores 数组中每名学生所有科目的平均分并显示。 
82.42857142857143
77.28571428571429
89.28571428571429
84.28571428571429
81.71428571428571

3. 使用随机函数生成[-1,1]之间服从均匀分布的 3x4 二维数组，并计算所有元素的和。
[[-0.5434021  -0.0569449  -0.10984966 -0.90260813]
 [-0.01882247 -0.46660599  0.52140256  0.42474122]
 [ 0.3122958  -0.06197657 -0.26717631 -0.08292239]]
-1.2518689400759253
'''
```

```python
#P29
#一、
import numpy as np
# 1.创建两个一维数组分别存储超市名称和水果名称。
shops = np.array(['DaRunFa','Walmart','HaoDe','NongGongShang'])
fruits = np.array(['apple','banana','orange','mango'])
# 2.创建一个 4x4 的二维数组存储不同超市的水果价格，其中价格由 4~10 范围内的随机数生成。 
prices = np.random.randint(4,10,16).reshape(4,4)
# 3.选择“大润发”的苹果和“好德”的香蕉，并将价格增加 1 元。 
prices[shops == 'DaRunFa',fruits == 'apple'] += 1
print('the price of apple in DaRunFa now: %d' %prices[shops == 'DaRunFa',fruits == 'apple'])
prices[shops == 'HaoDe',fruits == 'banana'] += 1
print('the price of banana in HaoDe now: %d' %prices[shops == 'HaoDe',fruits == 'banana'])
# 4.“农工商”水果大减价，所有水果价格减 2 元。 
prices[shops == 'NongGongShang'] -= 2 
print('the price in NongGongShang now: ',end='')
print(prices[shops == 'NongGongShang'])
# 5.统计四个超市苹果和芒果的销售均价。 
print('ave of apple is: %f'%prices[: , fruits == 'apple'].mean())
print('ave of mango is: %f'%prices[: , fruits == 'mango'].mean())
# 6.找出橘子价格最贵的超市名称（不是编号）。
t = 0
for i in range(0,4) :
    if prices[i, 2] > prices[t, 2] :
        t = i
print('the most expensive orange is in %s'%shops[t])
'''
the price of apple in DaRunFa now: 7
the price of banana in HaoDe now: 5
the price in NongGongShang now: [[6 7 4 6]]
ave of apple is: 6.750000
ave of mango is: 6.750000
the most expensive orange is in Walmart
'''
#二、
import numpy as np
steps = 10
rndwlk = np.random.normal(0, 1, size = (3, steps))
print('1）移动距离数组：')
print(rndwlk)
position = rndwlk.cumsum(axis = 1)
x = position[0]
y = position[1]
z = position[2]
print('\n2）每步走完后在三维的空间位置：')
print(position)
dists = np.sqrt(position[0]**2 + position[1]**2 + position[2]**2) #三维直角坐标系的距离公式
np.set_printoptions(precision=2)
print('\n3）每步走完后到原点的距离：')
print(dists)
print('\n4）Z轴到达的最远距离：%f'%abs(position[2]).max())
print('\n5）物体在三维空间距离原点的最近值：%f'%dists.min())
'''
1）移动距离数组：
[[ 0.09  0.52 -0.96 -0.96 -1.44  1.27 -0.61 -1.18  2.23  0.45]
 [-0.66 -2.22 -0.39 -0.25  0.36 -0.29  0.04  0.12  1.43  0.34]
 [ 0.56  0.56  0.96  0.33  2.15  1.56 -1.09 -2.05 -0.1  -0.48]]

2）每步走完后在三维的空间位置：
[[ 0.09  0.62 -0.34 -1.3  -2.74 -1.47 -2.08 -3.26 -1.03 -0.57]
 [-0.66 -2.87 -3.26 -3.51 -3.16 -3.44 -3.4  -3.29 -1.86 -1.51]
 [ 0.56  1.11  2.07  2.4   4.55  6.12  5.02  2.97  2.87  2.39]]

3）每步走完后到原点的距离：
[0.87 3.14 3.88 4.45 6.18 7.17 6.42 5.5  3.57 2.89]

4）Z轴到达的最远距离：6.116005

5）物体在三维空间距离原点的最近值：0.867622
'''
```

# 数据汇总与统计


```python
import pandas as pd
import numpy as np
from pandas import Series,DataFrame    #使用pd.
```

## series对象

1. 通过下标访问

```python
#series([data,index,index,...])
import pandas as pd
import numpy as np
from pandas import Series,DataFrame
height1=Series({'13' :187, '14' :190, '17':185, '2':178, '9':185})
print(height1['13'])#检索13号的身高
print(height1[1:3])#检索1、2号的身高
print(height1.values>=186)#检索大于186的球员
print(height1)#打印所有身高
```

2. 通过append添加成员

```python
import pandas as pd
import numpy as np
from pandas import Series,DataFrame
a=Series(['5','10'],index=[180,185])
height1=Series({'13' :187, '14' :190, '17':185, '2':178, '9':185})
height2=height1.append(a)
print(height2)
```

3. 删除成员

```python
import pandas as pd
import numpy as np
from pandas import Series,DataFrame
height1=Series({'13' :187, '14' :190, '17':185, '2':178, '9':185})
height1.dorp('13','9')
print(height1)
```

## Data_Frame对象

```python
data = [[19,170, 68], [20, 165,65], [18,175, 65]]
students=DataFrame (data, index= [1,2,3], columns=['age', 'height','weight'])
print(students)
#   age  height  weight
#1   19     170      68
#2   20     165      65
#3   18     175      65
```

1. 添加数据

```python
students['expense']=[1500,1600,1200]
#   age  height  weight  expense
#1   19     170      68     1500
#2   20     165      65     1600
#3   18     175      65     1200
```

2. 修改数据

```python
students['expense']=1000
print(stdents)
#   age  height  weight  expense
#1   19     170      68     1000
#2   20     165      65     1000
#3   18     175      65     1000
```

```python
students.loc[1, :] = [21,188, 70,20] 
#   age  height  weight  expense
#1   21      78      70       20
#2   20     165      65     1000
#3   18     175      65     1000

```

3. 删除数据

```python
students.drop(1,axis=0)#axis=0表示行
#   age  height  weight  expense
#1   21      78      70       20
#2   20     165      65     1000
```

```python
students.drop('expense', axis=1) # 删除expense列，axis=1表示列
#   age  height  weight  
#1   21      78      70 
#2   20     165      65 
#3   18     175      65
```

```python
students.drop([1,2],axis=0) # 删除多行
```

## 读写文件

```python
csv=pd.read_csv(file,sep=', ',header= 'infer' , index_col=None , names, skiprows, ...)
#读取csv文件

exc=pd.read_excel(file，sheetname,... )
#读取excel文件
```

| file      | 字符串，文件路径和文件名                                     |
| --------- | ------------------------------------------------------------ |
| sep       | 字符串，每行各数据之间的分隔符，默认为“,”                    |
| header    | header =None,文件中第一行不是列索引                          |
| index_col | 数字，用作行索引的列序号                                     |
| names     | 列表，定义列索引，默认文件中第- - 行为列索引                 |
| skiprows  | 整数或列表，需要忽略的行数或需要跳过的行号列表，skiprows=[2,3,5]，跳过2，3，5行 |

