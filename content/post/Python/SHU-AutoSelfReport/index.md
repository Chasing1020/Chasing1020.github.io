---
title: "SHU AutoSelfReport"
date: 2020-10-28T11:13:09+08:00
lastmod: 2020-10-28T11:13:09+08:00
draft: false
author: "Chasing1020"
comment: true
keywords: []
description: ""
tags: ['Selenium']
categories: ['Framework']
image: "shu.webp"
---

# SHU每日两报脚本
## 1. 实现原理

利用python中的Selenium库，并结合浏览器驱动，来自动完成每日两报的操作，最后测试结果将每天的体温设置区间为36度至37度之间（含小数点后一位）。同时，在使用前可以自己选择相应的填报日期，也可以在特定日期之内完成相应的填报操作。
## 2. 使用教程
### 2.1. 使用步骤
1、首先，此程序基于python 3.8.5版本运行，使用的浏览器为Edge，版本号86.0.622.51 (Official build) (64-bit)，IDE为PyCharm 2020.1.3 (Professional Edition)
2、打开命令行，使用pip指令安装selenium
`pip install selenium`
3、通过浏览器官网下载相应的浏览器启动插件，将其设置为系统环境变量(可选)，也可以在程序中自行设置浏览器启动驱动位置，如在E盘的E:\Edgedriver目录，就更改默认的地址 driverUrl = r"E:\Edgedriver\msedgedriver.exe"
4、运行程序时，请关闭其他任何可能影响浏览器运行的插件或者软件，如果网络信号不佳，则需要将time.sleep(1)中的数值调大，以等待网页的元素彻底加载成功
## 3. 代码实现
### 3.1. 准备工作
在本程序中，我使用了三个库，分别是selenium（主角），time以及random。
其次，设置好自己的浏览器驱动位置以及每日一报链接位置，并填写好自己的账号密码

```python
myUsername=r'' #在此输入你的学号
myPassword=r'' #在此输入你的姓名
baseUrl=r'https://selfreport.shu.edu.cn/' #默认的每日两报地址
driverUrl = r"E:\Edgedriver\msedgedriver.exe" #浏览器驱动，这里以Edge示例，不同的浏览器可以去官网下载
from selenium #完成web自动化的一系列操作
import time #设置程序等待时间，等待浏览器加载元素完全
import random #设置温度随机数
```
### 3.2. 登录账号
准备好以上步骤以后，我们就可以打开浏览器并对其进行相应的操作。

输入代码
```python
    driver = webdriver.Edge(driverUrl)#通过驱动器打开浏览器
    driver.get(baseUrl)#访问健康之路链接
    search_username = driver.find_element_by_id('username')#找到用户名位置
    search_username.send_keys(myUsername)#填写用户名
    search_password = driver.find_element_by_id('password')#找到密码位置
    search_password.send_keys(myPassword)#填写密码
    driver.find_element_by_id('submit').click()#找到元素并且自动点击登录
```
程序执行时，就会将自己的账号密码自动填入进入下章页面。


### 3.3. 进入报送历史界面
如图，需要点进报送历史：
[![B8AzKH.png](https://s1.ax1x.com/2020/10/28/B8AzKH.png)](https://imgchr.com/i/B8AzKH)

首先输入
```python	
driver.find_element_by_id('lbReportHistory').click()#找到对应历史报送的按钮，点击
```
然后即可进入历史界面，在这里每天的报送记录罗列如下：

[![B8AX8O.png](https://s1.ax1x.com/2020/10/28/B8AX8O.png)](https://imgchr.com/i/B8AX8O)


### 3.4. 填写对应的信息

```python
# 点击对应的天数：
object = str(date) + item
driver.find_element_by_partial_link_text(object).click()

# 勾选承诺项：
driver.find_element_by_id("p1_ChengNuo-inputEl-icon").click()

# 填写体温，随机在36.0-37.0之间
search_temperature = driver.find_element_by_id("p1_TiWen-inputEl")
temperature = str(random.randint(360, 370) / 10)
search_temperature.send_keys(temperature)

# 勾选状态"良好"
element = driver.find_element_by_id("fineui_0-inputEl")
driver.execute_script("arguments[0].click();", element)

# 当天随申码颜色："绿色"
driver.find_element_by_id("fineui_7-inputEl-icon").click()
element = driver.find_element_by_id('fineui_7-inputEl-icon')
driver.execute_script("arguments[0].click();", element)
# webdriver.ActionChains(driver).move_to_element(element).click(element).perform()

# 明天是否到食堂就餐："早餐，中餐，晚餐"
element = driver.find_element_by_id('fineui_8-inputEl-icon')
driver.execute_script("arguments[0].click();", element)
element = driver.find_element_by_id('fineui_9-inputEl-icon')
driver.execute_script("arguments[0].click();", element)
element = driver.find_element_by_id('fineui_10-inputEl-icon')
driver.execute_script("arguments[0].click();", element)
```


以上代码均是对于填写页面元素的捕捉，并对发现的第一个元素发起提交按钮。
在这里，程序代码不能写成如下：

```python
# 以下操作无法实现，原因应该是元素定位相互覆盖。
# driver.find_element_by_id("fineui_8-inputEl-icon").click()
# driver.find_element_by_id("fineui_9-inputEl-icon").click()
# driver.find_element_bu_id("fineui_10-inputEl-icon").click()
# driver.find_element_by_id("p1_ctl00_btnSubmit").click()
```
原因是代码中的元素相互覆盖，无法实现操作
最终选择并点击时的效果如下：
[![B8AOPK.png](https://s1.ax1x.com/2020/10/28/B8AOPK.png)](https://imgchr.com/i/B8AOPK)


### 3.5. 点击确认按钮
```python
# 点击提交
element = driver.find_element_by_id("p1_ctl00_btnSubmit")
driver.execute_script("arguments[0].click();", element)
time.sleep(1)
# 点击确认
element = driver.find_element_by_id("fineui_14")
driver.execute_script("arguments[0].click();", element)
time.sleep(3)
element = driver.find_element_by_id("fineui_19")
# element = driver.find_element_by_class_name("f-btn-text")
driver.execute_script("arguments[0].click();", element)
time.sleep(1)
```
在这里我使用了time.sleep()函数，为了让程序停顿，原页面加载的过程中，会出现提交框晚出现的情况，所以需要让程序“等待”浏览器加载结束，最后填报。
## 4. 完整代码
```python
#-*- coding = utf-8 -*-
#@Time : 2020-10-25 15:24
#@Author : Jiancong Zhu
#@Email : 643601464@qq.com
#@File : release.py
#@Software: PyCharm

myUsername=r'' #在此输入你的学号
myPassword=r'' #在此输入你的姓名
baseUrl=r'https://selfreport.shu.edu.cn/' #默认的每日两报地址
driverUrl = r"E:\Edgedriver\msedgedriver.exe" #浏览器驱动，这里以Edge示例，不同的浏览器可以去个官网下载
from selenium
import time
import random

def main():
    print("Hello,")
    driver = webdriver.Edge(driverUrl)
    driver.get(baseUrl)
    search_username = driver.find_element_by_id('username')
    search_username.send_keys(myUsername)
    search_password = driver.find_element_by_id('password')
    search_password.send_keys(myPassword)
    driver.find_element_by_id('submit').click()

    for date in range(19,26,1):#在此修改你想实现的日期，左闭右开，如这里为[19,26)，即19至25号
        for item in ['晨报','晚报']:
            # print("Hello, world!")
            # driver = webdriver.Edge(driverUrl)
            # driver.get(baseUrl)
            # driver.find_element_by_id('username')
            # search_username = driver.find_element_by_id('username')
            # search_username.send_keys(myUsername)
            # search_password = driver.find_element_by_id('password')
            # search_password.send_keys(myPassword)
            # driver.find_element_by_id('submit').click()

            # 进入报送历史：
            driver.find_element_by_id('lbReportHistory').click()

            # 点击对应的天数：
            object = str(date) + item
            driver.find_element_by_partial_link_text(object).click()

            # 勾选承诺项：
            driver.find_element_by_id("p1_ChengNuo-inputEl-icon").click()

            # 填写体温，随机在36.0-37.0之间
            search_temperature = driver.find_element_by_id("p1_TiWen-inputEl")
            temperature = str(random.randint(360, 370) / 10)
            search_temperature.send_keys(temperature)

            # 勾选状态"良好"
            element = driver.find_element_by_id("fineui_0-inputEl")
            driver.execute_script("arguments[0].click();", element)

            # 当天随申码颜色："绿色"
            driver.find_element_by_id("fineui_7-inputEl-icon").click()
            element = driver.find_element_by_id('fineui_7-inputEl-icon')
            driver.execute_script("arguments[0].click();", element)
            # webdriver.ActionChains(driver).move_to_element(element).click(element).perform()

            # 明天是否到食堂就餐："早餐，中餐，晚餐"
            element = driver.find_element_by_id('fineui_8-inputEl-icon')
            driver.execute_script("arguments[0].click();", element)
            element = driver.find_element_by_id('fineui_9-inputEl-icon')
            driver.execute_script("arguments[0].click();", element)
            element = driver.find_element_by_id('fineui_10-inputEl-icon')
            driver.execute_script("arguments[0].click();", element)

            # 以下操作无法实现，原因应该是元素定位相互覆盖。
            # driver.find_element_by_id("fineui_8-inputEl-icon").click()
            # driver.find_element_by_id("fineui_9-inputEl-icon").click()
            # driver.find_element_bu_id("fineui_10-inputEl-icon").click()
            # driver.find_element_by_id("p1_ctl00_btnSubmit").click()

            # 点击提交
            element = driver.find_element_by_id("p1_ctl00_btnSubmit")
            driver.execute_script("arguments[0].click();", element)
            time.sleep(1)
            # 点击确认
            element = driver.find_element_by_id("fineui_14")
            driver.execute_script("arguments[0].click();", element)
            time.sleep(3)
            element = driver.find_element_by_id("fineui_19")
            # element = driver.find_element_by_class_name("f-btn-text")
            driver.execute_script("arguments[0].click();", element)
            time.sleep(1)

    driver.quit()
    print("world!") # 输出Hello,world! 完美的结束

if __name__ == "__main__": #当程序执行时
    main() #开始
```
