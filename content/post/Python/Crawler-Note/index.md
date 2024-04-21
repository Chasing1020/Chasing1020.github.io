---
title: "Crawler Note"
date: 2020-10-12T20:12:03+08:00
lastmod: 2020-10-12T20:12:03+08:00
draft: false
author: "Chasing1020"
comment: true
keywords: []
description: ""
tags: ['Note']
categories: ['Note']
image: "crawlers.webp"
---

# 网页爬虫项目实战经验
此篇记录了网页爬虫的基本使用库，以及常用的正则表达式操作等。
同时给出了豆瓣电影top250的爬取方式（经典爬虫入门项目）。
以及对于CSDN的博主主页单个以及多个文章的爬取，并利用工具将其转换为pdf格式


# 1.Bs4

```python
bs4将复杂html文档转换成一个复杂的树形结构，每个节点都是python对象，所有对象可以分为4种

-Tag
-NavigableString
-BeautifulSoup
-Comment

```
-------------------

## 1.1 analyze
```python
#bs4分析文档
from bs4 import BeautifulSoup

file = open("./baidu.html", "rb")
html = file.read()
bs = BeautifulSoup(html, "html.parser")

print(type(bs.head))#<class 'bs4.element.Tag'>标签及其内容
#1.tag  标签及内容：拿到它所找到的第一个内容

print(type(bs.title.string))#<class 'bs4.element.NavigableString'>标签里的内容
#2.NavigableString标签里的内容

print(type(bs.a.attrs))#<class 'dict'>#<class 'dict'>
#3.标签内部的字典信息

print(type(bs))#<class 'bs4.BeautifulSoup'>
#4.表示整个文档

print(type(bs.a.string))#<class 'bs4.element.Comment'>
#5.第一个a中的注释里的内容,不包含注释符号

```
-------------------
## 1.2 Traversal
```python
#文档的遍历
from bs4 import BeautifulSoup
file = open("./baidu.html", "rb")
html = file.read().decode("utf-8")
bs = BeautifulSoup(html, "html.parser")
print(bs.head.contents)#列表类型，可以用下标访问
print(bs.head.contents[1])

```
-------------------
## 1.3 find
```python
#文档搜索
import re
from bs4 import BeautifulSoup
file = open("./baidu.html", "rb")
html = file.read().decode("utf-8")
bs = BeautifulSoup(html, "html.parser")

#1.find_all()
#查找与字符串完全匹配的内容
t_list=bs.find_all("a")
for  i in t_list:
    print(i)
#所有<a>标签下面的内容

#2.search()
#正则表达式来搜索
t_list=bs.find_all(re.compile("a"))#匹配与正则表达式a有关的全部内容
for  i in t_list:
    print(i)

#3.根据函数的要求来搜索
#自定义函数查找
def name_is_exists(tag):
    return tag.has_attr("name")

t_list=bs.find_all(name_is_exists)
for  i in t_list:
    print(i)

#4.kwargs
寻找id="head"内的全部内容
t_list=bs.find_all(id="head")
for  i in t_list:
    print(i)

#5.文本参数
寻找文本的内容
t_list=bs.find_all(text=["hao123","贴吧","地图"])
t_list=bs.find_all(text=re.compile("\d"))  #寻找符合正则表达式的项目，这里是寻找所有整数
for i in t_list:
    print(i)

#6.limit参数
t_list=bs.find_all("a",limit=3)   #只搜索三个
for i in t_list:
    print(i)

#7.css选择器
t_list=bs.select('title')
t_list=bs.select(".mnav")#寻找类名
t_list=bs.select('#u1')#通过id来查找
t_list=bs.select("a[class='bri']")#通过属性来查找
t_list=bs.select("head>title")#通过子标签来查找
t_list=bs.select(".mnav ~ .bri")#通过子标签来查找
print(t_list[0].get_text())#获取文本

for i in t_list:
    print(i)
```
# 2. Re
-------------------
#正则表达式：字符串模式（判断字符串是否符合一定标准）
import re
#创建模式对象
## 2.1 new object
```python
#search
pat=re.compile("AA")#此处的AA属于正则表达式
ans=pat.search("ABC")#这里的search内部属于被搜索的内容
print(ans)#输出None
ans2=pat.search("AABCAA")#优先找到第一个结果
print(ans2)#输出<re.Match object; span=(3, 5), match='AA'>
```
----
## 2.2 findall
```python
#findall
ans=re.findall("a+","aaabc")#前面是正则表达式，后面是待求的结果
print(ans)#输出['aaa']
```
----
## 2.3 sub
```python
#sub(1,2,3)
ans=re.sub("a","A","abcdcasd")#对于最后一个表达式，用a换成A
print(ans)
#建议在正则表达式种，被比较的字符前面加上r，不用担心转义字符的问题
```
## 2.4 demo
1、匹配中文:[\u4e00-\u9fa5]

2、英文字母:[a-zA-Z]

3、数字:[0-9]

4、匹配中文，英文字母和数字及下划线：^[\u4e00-\u9fa5_a-zA-Z0-9]+$
同时判断输入长度：
[\u4e00-\u9fa5_a-zA-Z0-9_]{4,10}

5、
(?!_)　　不能以_开头
(?!.*?_$)　　不能以_结尾
[a-zA-Z0-9_\u4e00-\u9fa5]+　　至少一个汉字、数字、字母、下划线
$　　与字符串结束的地方匹配

6、只含有汉字、数字、字母、下划线，下划线位置不限：
^[a-zA-Z0-9_\u4e00-\u9fa5]+$

7、由数字、26个英文字母或者下划线组成的字符串
^\w+$

8、2~4个汉字
"^[\u4E00-\u9FA5]{2,4}$";

9、最长不得超过7个汉字，或14个字节(数字，字母和下划线)正则表达式
^[\u4e00-\u9fa5]{1,7}$|^[\dA-Za-z_]{1,14}$


10、匹配双字节字符(包括汉字在内)：[^x00-xff]
评注：可以用来计算字符串的长度（一个双字节字符长度计2，ASCII字符计1）

11、匹配空白行的正则表达式：ns*r
评注：可以用来删除空白行

12、匹配HTML标记的正则表达式：<(S*?)[^>]*>.*?|<.*? />
评注：网上流传的版本太糟糕，上面这个也仅仅能匹配部分，对于复杂的嵌套标记依旧无能为力

13、匹配首尾空白字符的正则表达式：^s*|s*$
评注：可以用来删除行首行尾的空白字符(包括空格、制表符、换页符等等)，非常有用的表达式

14、匹配Email地址的正则表达式：^[a-zA-Z0-9][\w\.-]*[a-zA-Z0-9]@[a-zA-Z0-9][\w\.-]*[a-zA-Z0-9]\.[a-zA-Z][a-zA-Z\.]*[a-zA-Z]$

评注：表单验证时很实用

15、手机号：^((13[0-9])|(14[0-9])|(15[0-9])|(17[0-9])|(18[0-9]))\d{8}$

16、身份证：(^\d{15}$)|(^\d{17}([0-9]|X|x)$)

17、匹配网址URL的正则表达式：[a-zA-z]+://[^s]*
评注：网上流传的版本功能很有限，上面这个基本可以满足需求

18、匹配帐号是否合法(字母开头，允许5-16字节，允许字母数字下划线)：^[a-zA-Z][a-zA-Z0-9_]{4,15}$
评注：表单验证时很实用


19、匹配国内电话号码：d{3}-d{8}|d{4}-d{7}
评注：匹配形式如 0511-4405222 或 021-87888822

20、匹配腾讯QQ号：[1-9][0-9]{4,}
评注：腾讯QQ号从10000开始

21、匹配中国邮政编码：[1-9]d{5}(?!d)
评注：中国邮政编码为6位数字

22、匹配身份证：d{15}|d{18}
评注：中国的身份证为15位或18位

23、匹配ip地址：d+.d+.d+.d+
评注：提取ip地址时有用


24、匹配特定数字：
^[1-9]d*$　 　 //匹配正整数
^-[1-9]d*$ 　 //匹配负整数
^-?[1-9]d*$　　 //匹配整数
^[1-9]d*|0$　 //匹配非负整数（正整数 + 0）
^-[1-9]d*|0$　　 //匹配非正整数（负整数 + 0）
^[1-9]d*.d*|0.d*[1-9]d*$　　 //匹配正浮点数
^-([1-9]d*.d*|0.d*[1-9]d*)$　 //匹配负浮点数
^-?([1-9]d*.d*|0.d*[1-9]d*|0?.0+|0)$　 //匹配浮点数
^[1-9]d*.d*|0.d*[1-9]d*|0?.0+|0$　　 //匹配非负浮点数（正浮点数 + 0）
^(-([1-9]d*.d*|0.d*[1-9]d*))|0?.0+|0$　　//匹配非正浮点数（负浮点数 + 0）
评注：处理大量数据时有用，具体应用时注意修正


25、匹配特定字符串：
^[A-Za-z]+$　　//匹配由26个英文字母组成的字符串
^[A-Z]+$　　//匹配由26个英文字母的大写组成的字符串
^[a-z]+$　　//匹配由26个英文字母的小写组成的字符串
^[A-Za-z0-9]+$　　//匹配由数字和26个英文字母组成的字符串
^w+$　　//匹配由数字、26个英文字母或者下划线组成的字符串

26、
在使用RegularExpressionValidator验证控件时的验证功能及其验证表达式介绍如下:
只能输入数字：“^[0-9]*$”
只能输入n位的数字：“^d{n}$”
只能输入至少n位数字：“^d{n,}$”
只能输入m-n位的数字：“^d{m,n}$”
只能输入零和非零开头的数字：“^(0|[1-9][0-9]*)$”
只能输入有两位小数的正实数：“^[0-9]+(.[0-9]{2})?$”
只能输入有1-3位小数的正实数：“^[0-9]+(.[0-9]{1,3})?$”
只能输入非零的正整数：“^+?[1-9][0-9]*$”
只能输入非零的负整数：“^-[1-9][0-9]*$”
只能输入长度为3的字符：“^.{3}$”
只能输入由26个英文字母组成的字符串：“^[A-Za-z]+$”
只能输入由26个大写英文字母组成的字符串：“^[A-Z]+$”
只能输入由26个小写英文字母组成的字符串：“^[a-z]+$”
只能输入由数字和26个英文字母组成的字符串：“^[A-Za-z0-9]+$”
只能输入由数字、26个英文字母或者下划线组成的字符串：“^w+$”
验证用户密码:“^[a-zA-Z]w{5,17}$”正确格式为：以字母开头，长度在6-18之间，
只能包含字符、数字和下划线。
验证是否含有^%&',;=?$"等字符：“[^%&',;=?$x22]+”
只能输入汉字：“^[u4e00-u9fa5],{0,}$”
验证Email地址：“^w+[-+.]w+)*@w+([-.]w+)*.w+([-.]w+)*$”
验证InternetURL：“^http://([w-]+.)+[w-]+(/[w-./?%&=]*)?$”
验证身份证号（15位或18位数字）：“^d{15}|d{}18$”
验证一年的12个月：“^(0?[1-9]|1[0-2])$”正确格式为：“01”-“09”和“1”“12”
验证一个月的31天：“^((0?[1-9])|((1|2)[0-9])|30|31)$”
正确格式为：“01”“09”和“1”“31”。
匹配中文字符的正则表达式： [u4e00-u9fa5]
匹配双字节字符(包括汉字在内)：[^x00-xff]
匹配空行的正则表达式：n[s| ]*r
匹配HTML标记的正则表达式：/<(.*)>.*|<(.*) />/
匹配首尾空格的正则表达式：(^s*)|(s*$)
匹配Email地址的正则表达式：w+([-+.]w+)*@w+([-.]w+)*.w+([-.]w+)*
匹配网址URL的正则表达式：http://([w-]+.)+[w-]+(/[w- ./?%&=]*)?

# 3. Urllib
----

## 3.1 get
----
```python
import urllib.request
#1、获取一个get请求
try:
    responce = urllib.request.urlopen("http://httpbin.org/get",timeout=0.01)
    print(responce.read().decode('utf-8'))  #对获取到的网页源码进行utf-8解码
except urllib.error.URLError as e:
    print("time out")   #超时处理
```
## 3.2 post
----
```python
#2、获取一个post请求
import urllib.parse
data = bytes(urllib.parse.urlencode({"hello": "world"}), encoding="utf-8")
response = urllib.request.urlopen("http://httpbin.org/post",data = data)
print(response.read().decode("utf-8"))

responce = urllib.request.urlopen("http://www.baidu.com")
print(responce.status)  #获取状态码
print(responce.getheaders())   #获取全部信息
print(responce.getheader("Server"))    #获取全部信息

```


## 3.3 418 error
```python
#3、post请求，反418
url="http://httpbin.org/post"
headers={
    "User-Agent" : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.89 Safari/537.36 Edg/84.0.522.44"
}
data = bytes(urllib.parse.urlencode({"hello":"world"}), encoding="utf-8")
req=urllib.request.Request(url=url, data=data, headers=headers, method="POST")
response=urllib.request.urlopen(req)
print(response.read().decode("utf-8"))
```
## 3.4 test
```python
#4、爬取豆瓣
url="https://www.douban.com"
headers={
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.89 Safari/537.36 Edg/84.0.522.44"
}
data = bytes(urllib.parse.urlencode({"hello":"world"}), encoding="utf-8")
req=urllib.request.Request(url=url, headers=headers)
response=urllib.request.urlopen(req)
print(response.read().decode("utf-8"))
```
# 4. Xwlt
## 4.1 new
```python
import xlwt

workbook = xlwt.Workbook(encoding="utf-8")#创建对象
worksheet = workbook.add_sheet('sheet1')#创建工作表
for i in range(1,10):
    for j in range(1,i+1):
        worksheet.write(i-1, j-1, '%d*%d=%d'%(i,j,i*j))  # 行,列，内容

workbook.save("student.xls")
```
# 5. Release
## 5.1 Top250
爬取豆瓣电影Top250，并将其保存在sql数据库中
```python
#-*- coding = utf-8 -*-
#@Time : 2020/10/6 21:00
#@Author : chasing
#@File : spyder.py
#@Software: PyCharm


from bs4 import BeautifulSoup  # 网页解析，获取数据
import re  # 正则表达式，进行文字匹配
import urllib.request
import urllib.error  # 制定URL，获取网页数据
import xlwt  # 进行excel操作
import sqlite3  # 进行SQLite数据库操作


def main():
    baseurl = "https://movie.douban.com/top250?start="
    # 1.爬取网页
    datalist = getData(baseurl)
    #savepath = "豆瓣电影Top250.xls"
    dbpath = "movie.db"
    # 3.保存数据
    # saveData(datalist,savepath)
    saveData2DB(datalist, dbpath)

    # askURL("https://movie.douban.com/top250?start=")


# 影片详情链接的规则
findLink = re.compile(r'<a href="(.*?)">')  # 创建正则表达式对象，表示规则（字符串的模式）
# 影片图片
findImgSrc = re.compile(r'<img.*src="(.*?)"', re.S)  # re.S 让换行符包含在字符中
# 影片片名
findTitle = re.compile(r'<span class="title">(.*)</span>')
# 影片评分
findRating = re.compile(
    r'<span class="rating_num" property="v:average">(.*)</span>')
# 找到评价人数
findJudge = re.compile(r'<span>(\d*)人评价</span>')
# 找到概况
findInq = re.compile(r'<span class="inq">(.*)</span>')
# 找到影片的相关内容
findBd = re.compile(r'<p class="">(.*?)</p>', re.S)

# 爬取网页
def getData(baseurl):
    datalist = []
    for i in range(0, 10):  # 调用获取页面信息的函数，10次
        url = baseurl + str(i*25)
        html = askURL(url)  # 保存获取到的网页源码

        # 2.逐一解析数据
        soup = BeautifulSoup(html, "html.parser")
        for item in soup.find_all('div', class_="item"): #查找符合要求的字符串，形成列表
            # print(item)   #测试：查看电影item全部信息
            data = []  # 保存一部电影的所有信息
            item = str(item)

            # 影片详情的链接
            link = re.findall(findLink, item)[0]  # re库用来通过正则表达式查找指定的字符串
            data.append(link)  # 添加链接

            imgSrc = re.findall(findImgSrc, item)[0]
            data.append(imgSrc)  # 添加图片

            titles = re.findall(findTitle, item)  # 片名可能只有一个中文名，没有外国名
            if(len(titles) == 2):
                ctitle = titles[0]  # 添加中文名
                data.append(ctitle)
                otitle = titles[1].replace("/", "")  # 去掉无关的符号
                data.append(otitle)  # 添加外国名
            else:
                data.append(titles[0])
                data.append(' ')  # 外国名字留空

            rating = re.findall(findRating, item)[0]
            data.append(rating)  # 添加评分

            judgeNum = re.findall(findJudge, item)[0]
            data.append(judgeNum)  # 提加评价人数

            inq = re.findall(findInq, item)
            if len(inq) != 0:
                inq = inq[0].replace("。", "")  # 去掉句号
                data.append(inq)                # 添加概述
            else:
                data.append(" ")  # 留空

            bd = re.findall(findBd, item)[0]
            bd = re.sub('<br(\s+)?/>(\s+)?', " ", bd)  # 去掉<br/>
            bd = re.sub('/', " ", bd)  # 替换/
            data.append(bd.strip())  # 去掉前后的空格

            datalist.append(data)  # 把处理好的一部电影信息放入datalist

    return datalist


# 得到指定一个URL的网页内容
def askURL(url):
    head = {  # 模拟浏览器头部信息，向豆瓣服务器发送消息
        "User-Agent": "Mozilla / 5.0(Windows NT 10.0; Win64; x64) AppleWebKit / 537.36(KHTML, like Gecko) Chrome / 80.0.3987.122  Safari / 537.36"
    }
    # 用户代理，表示告诉豆瓣服务器，我们是什么类型的机器、浏览器（本质上是告诉浏览器，我们可以接收什么水平的文件内容）

    request = urllib.request.Request(url, headers=head)
    html = ""
    try:
        response = urllib.request.urlopen(request)
        html = response.read().decode("utf-8")
        # print(html)
    except urllib.error.URLError as e:
        if hasattr(e, "code"):
            print(e.code)
        if hasattr(e, "reason"):
            print(e.reason)
    return html


# 保存数据
def saveData(datalist, savepath):
    print("save....")
    book = xlwt.Workbook(encoding="utf-8", style_compression=0)  # 创建workbook对象
    sheet = book.add_sheet('豆瓣电影Top250', cell_overwrite_ok=True)  # 创建工作表
    col = ("电影详情链接", "图片链接", "影片中文名", "影片外国名", "评分", "评价数", "概况", "相关信息")
    for i in range(0, 8):
        sheet.write(0, i, col[i])  # 列名
    for i in range(0, 250):
        print("第%d条" % (i+1))
        data = datalist[i]
        for j in range(0, 8):
            sheet.write(i+1, j, data[j])  # 数据

    book.save(savepath)  # 保存


def saveData2DB(datalist, dbpath):
    init_db(dbpath)
    conn = sqlite3.connect(dbpath)
    cur = conn.cursor()

    for data in datalist:
        for index in range(len(data)):
            if index == 4 or index == 5:
                continue
            data[index] = '"'+data[index]+'"'
        sql = '''
                insert into movie250 (
                info_link,pic_link,cname,ename,score,rated,instroduction,info) 
                values(%s)''' % ",".join(data)
        print(sql)
        cur.execute(sql)
        conn.commit()
    cur.close()
    conn.close()


def init_db(dbpath):
    sql = '''
        create table movie250 
        (
        id integer primary key autoincrement,
        info_link text,
        pic_link text,
        cname varchar,
        ename varchar,
        score numeric ,
        rated numeric ,
        instroduction text,
        info text
        )
    
    '''  # 创建数据表
    conn = sqlite3.connect(dbpath)
    cursor = conn.cursor()
    cursor.execute(sql)
    conn.commit()
    conn.close()


if __name__ == "__main__":  # 当程序执行时
    # 调用函数
    main()
    # init_db("movietest.db")
    print("爬取完毕！")
```

# 6. CSDN
## 6.1 for a certain passage
对于一个博主的确切的文章链接，可以使用以下代码爬取其中的文章内容，并保存为pdf格式
```python
#-*- coding = utf-8 -*-
#@Time : 2020-10-12 18:08
#@Author : chasing
#@File : csdn.py
#@Software: PyCharm

import re
import requests
import parsel
import pdfkit
BaseUrl='https://blog.csdn.net/justidle/article/details/106850487'
cmp=re.compile(r'<meta name="keywords" content="(.*?)">', re.S)
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.75 Safari/537.36 Edg/86.0.622.38'}
response = requests.get(BaseUrl, headers=headers)
print("响应体："+response.text)
Title=re.findall(cmp,response.text)
FileUrl='D:\\desktop\\'+' '.join(Title)+'.pdf'
print("期望保存位置："+FileUrl)
Html1=r'<!doctype html><html><head><meta charset="UTF-8"><title>'
Html2=r'</title></head><body>{content}</body></html>'
html=Html1+' '.join(Title)+Html2
selector = parsel.Selector(response.text)
article = selector.css('article').get()
print("文章本体："+article)
with open('1.html', mode='w', encoding='utf-8') as f:
    f.write(html.format(content=article))
config = pdfkit.configuration(wkhtmltopdf='E:\\wkhtmltopdf\\bin\\wkhtmltopdf.exe')
pdfkit.from_file("1.html",FileUrl,configuration=config)
print("文件保存成功，保存文件的路径为："+FileUrl)
print("Hello World!")
```
## 6.2 All passages
对于博主的全部文章，可以使用以下方法，获取其所有文章的链接
```python
#-*- coding = utf-8 -*-
#@Time : 2020-10-12 20:09
#@Author : chasing
#@File : Release.py
#@Software: PyCharm

#导入相应的模块
import re
import requests
import parsel
import pdfkit

def main():
    # Pages=askPages(BaseUrl)
    # print(Pages)
    i=1
    askUrl(baseUrl, i)
    for i in range(2,100,1):
        tempUrl = baseUrl+str(i)
        askUrl(tempUrl, i)
    Response()

findChinese=re.compile(r'[\u4e00-\u9fa5]+',re.S)#pdfkit不能能保存含有特殊符号名称的文件
findBranch=re.compile(r'<a href="(.*?)" target="_blank">')
findFile=re.compile(r'<meta name="keywords" content="(.*?)">', re.S)
# findPages=re.compile(r'<li data-page="(\d+)" class="ui-pager">.*?</li>',re.S)

headers = {
"user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.75 Safari/537.36 Edg/86.0.622.38"
}
baseUrl='https://blog.csdn.net/qq_27133869'
# 页面数量为动态
# def askPages(BaseUrl):#js
#     response = requests.get(BaseUrl, headers=headers)
#     print(response.text)
#     Pages = re.findall(FindPages, response.text)
#     return Pages
def askUrl(baseUrl,i):
    baseResponse = requests.get(baseUrl, headers=headers)
    # print(baseResponse.text)
    branchUrls=re.findall(findBranch,baseResponse.text)
    assert branchUrls
    for j in range(7):
        branchUrls.pop()#删除帮助文档
    assert branchUrls#为空直接跳出，节省资源
    # print(branchUrls)
    times=1
    for BranchUrl in branchUrls:
        branchResponse = requests.get(BranchUrl, headers=headers)
        #保存的文件名
        tempTitle = ''.join(re.findall(findFile, branchResponse.text))
        print(tempTitle)
        print(re.findall(findChinese, tempTitle))
        finalTitle = " ".join(re.findall(findChinese, tempTitle))
        print("第 %d 面的 %d 篇文章名为:" %(i, times)+str(finalTitle)+'\n')
        #最终网页源代码
        finalHtml =r'<!doctype html><html><head><meta charset="UTF-8"><title>' + ' '.join(finalTitle) + r'</title></head><body>{content}</body></html>'
        #pdf文件的保存位置
        fileUrl = 'D:\\desktop\\CSDN\\littlePING\\' + ''.join(finalTitle) + '.pdf'
        print("第 %d 面的 %d 篇文章保存路径为:" %(i, times) + str(fileUrl) + '\n')
        selector = parsel.Selector(branchResponse.text)
        article = selector.css('article').get()
        #文件保存的位置
        with open('temp.html', mode='w', encoding='utf-8') as f:
            f.write(finalHtml.format(content=article))
        try:
            config = pdfkit.configuration(wkhtmltopdf='E:\\wkhtmltopdf\\bin\\wkhtmltopdf.exe')
            # config = pdfkit.configuration(wkhtmltopdf=path_wk)
            with open('temp.html', 'r', encoding='utf-8') as f:
                pdfkit.from_file(f, fileUrl, configuration=config)
            print("第 %d 面的 %d 篇文章pdf文件保存成功！" % (i, times)+'\n')
        except:
            print("第 %d 面的 %d 篇文章pdf文件保存失败！" % (i, times)+'\n')
            pass
            # continue
        times+=1
    print("页面 %d 中的所有文件保存成功"%i+'\n')
def Response():
    print("Hello World")

if __name__ == "__main__":  # 当程序执行时
    # 调用函数
    main()
```
