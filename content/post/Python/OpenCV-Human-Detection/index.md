---
title: "OpenCV Human Detection"
date: 2020-10-18T10:30:09+08:00
lastmod: 2020-10-18T10:30:09+08:00
draft: false
author: "Chasing1020"
comment: true
keywords: []
description: ""
tags: ['OpenCV']
categories: ['Framework']
image: "opencv.webp"
---

# 利用opencv进行人脸检测与识别

## 1. OpenCV基本操作
### 1.1 配置环境
按win+R输入cmd打开命令行，在命令行下，输入

pip install numpy

pip install opencv-python

```python
#程序运行时，加入模块
import cv2
import numpy as np
```

### 1.2 图片加载、显示和保存

```python
import cv2
# 生成图片
img = cv2.imread("1.jpg")
# 生成灰色图片
imgGrey = cv2.imread("1.jpg", 0)
# 展示原图
cv2.imshow("img", img)
# 展示灰色图片
cv2.imshow("imgGrey", imgGrey)
# 等待图片的关闭
cv2.waitKey()
# 保存灰色图片
cv2.imwrite("Copy.jpg", imgGrey)
```
### 1.3 图像显示窗口创建与销毁
cv2.namedWindow(窗口名，属性) 创建一个窗口

属性—指定窗口大小模式： 

cv2.WINDOW_AUTOSIZE：根据图像大小自动创建大小
cv2.WINDOW_NORMAL：窗口大小可调整
cv2.destoryAllWindows(窗口名) 删除任何建立的窗口

```python
import cv2

img = cv2.imread("1.jpg")

cv2.namedWindow("img", cv2.WINDOW_NORMAL)
cv2.imshow("img", img)
cv2.waitKey()
cv2.destroyAllWindows()
```
### 1.4 图片宽、高、通道数获取
img.shape 返回图像高（图像矩阵的行数）、宽（图像矩阵的列数）和通道数3个属性组成的元组，若图像是非彩色图，则只返回高和宽组成的元组。
```python
import cv2

img = cv2.imread("1.jpg")
imgGrey = cv2.imread("1.jpg", 0)

sp1 = img.shape
sp2 = imgGrey.shape

print(sp1)
print(sp2)
# ======输出=======
#(1200, 1920, 3)
#(1200, 1920)
```
### 1.5 图像像素数目和图像数据类型的获取
图像矩阵img的size属性和dtype分别对应图像的像素总数目和图像数据类型。一般情况下，图像的数据类型是uint8
```python
import cv2

img = cv2.imread("1.jpg")

imgSize = img.size
print(imgSize)

ty = img.dtype
print(ty)
#======输出========
#6912000
#uint8
```

### 1. 6 生成指定大小的空图像

emptyImage = np.zeros(img.shape, np.uint8)

```python
import cv2
import numpy as np

img = cv2.imread("1.jpg")
imgZero = np.zeros(img.shape, np.uint8)

imgFix = np.zeros((300, 500, 3), np.uint8)
# imgFix = np.zeros((300,500),np.uint8)

cv2.imshow("img", img)
cv2.imshow("imgZero", imgZero)
cv2.imshow("imgFix", imgFix)
cv2.waitKey()
```
### 1.7 访问和操作图像像素
 OpenCV中图像矩阵的顺序是B、G、R。可以直接通过坐标位置访问和操作图像像素。
```python
#获取图像的三通道
blue,green,red = cv2.split(f)    
#或者
blue = f[:,:,0]
green = f[:,:,1]
red = f[:,:,2]
```
OpenCV中图像矩阵的顺序是B、G、R。可以直接通过坐标位置访问和操作图像像素。
```python
import cv2
 
img = cv2.imread("01.jpg")
 
numb = img[50,100]
print(numb)

img[50,100] = (0,0,255)#将50，100处的像素点改为红色
cv2.imshow("img",img)
cv2.waitKey()
```
分开访问图像某一通道像素值
```python
import cv2

img = cv2.imread("01.jpg")

img[0:100,100:200,0] = 255
img[100:200,200:300,1] = 255
img[200:300,300:400,2] = 255

cv2.imshow("img",img)
cv2.waitKey()
```
更改某一矩阵中的像素值
```python
import cv2

img = cv2.imread("01.jpg")

img[0:50,1:100] = (0,0,255) 

cv2.imshow("img",img)
cv2.waitKey()
```
### 1.8 图像三通道分离和合并
分离图像通道可以使用cv2中的split函数，合并使用merge函数。
```python
import cv2
 
img = cv2.imread("01.jpg")

b , g , r = cv2.split(img)

# b = cv2.split(img)[0]
# g = cv2.split(img)[1]
# r = cv2.split(img)[2]

merged = cv2.merge([b,g,r])

cv2.imshow("Blue",b)
cv2.imshow("Green",g)
cv2.imshow("Red",r)

cv2.imshow("Merged",merged)
cv2.waitKey()
```
### 1.9 在图像上输出文字及图片
使用putText函数在图片上输出文字，函数原型：
`putText(img, text, org, fontFace, fontScale, color, thickness=None, lineType=None, bottomLeftOrigin=None)`

| img       | 图像           |
| --------- | -------------- |
| text      | 要输出的文本   |
| org       | 文字的起点坐标 |
| fontFace  | 字体           |
| fontScale | 字体大小       |
| color     | 字体颜色       |
| thickness | 字图加粗       |


```python
import cv2

img = cv2.imread("01.jpg")
 
cv2.putText(img,"Print some text to img",(100,100),cv2.FONT_HERSHEY_SIMPLEX,1,(0,0,255))
 
cv2.imshow("img",img)
cv2.waitKey()

```

绘制矩形和圆
```python
cv2.rectangle(img, (x, y, x + w, y + h), color=(0, 255, 0), thickness=12)
cv2.circle(img, center=(x + w // 2, y + h // 2), radius=w // 2, color=(0, 0, 255), thickness=2)
```
### 1.10 图像缩放
```python
import cv2

img = cv2.imread("1.jpg")
cv2.imshow("img", img)

img2 = cv2.resize(img, (200, 100))

cv2.imshow("img2", img1)

cv2.waitKey()
```

| interpolation 选项 | 所用的插值方法                                               |
| ------------------ | ------------------------------------------------------------ |
| INTER_NEAREST      | 最近邻插值                                                   |
| INTER_LINEAR       | 双线性插值（默认设置）                                       |
| INTER_AREA         | 使用像素区域关系进行重采样。 它可能是图像抽取的首选方法，因为它会产生无云纹理的结果。 但是当图像缩放时，它类似于INTER_NEAREST方法。 |
| INTER_CUBIC        | 4x4像素邻域的双三次插值                                      |
| INTER_LANCZOS4     | 8x8像素邻域的Lanczos插值                                     |


```python
import cv2

img = cv2.imread('./res/aero3.jpg')
print(img.shape[:2])

height, width = img.shape[:2]

reSize1 = cv2.resize(img, (2*width, 2*height), interpolation=cv2.INTER_CUBIC)
reSize2 = cv2.resize(img, (int(width/2), int(height/2)), interpolation=cv2.INTER_CUBIC)

cv2.imshow('reSize1', reSize1)
cv2.imshow('reSize2', reSize2)

cv2.waitKey()
cv2.destroyAllWindows()
```
### 1.11 实现正常退出
cv2.waitkey(delaytime)------->returnvalue
在delaytime时间内,按键盘, 返回所按键的ASCII值;若未在delaytime时间内按任何键, 返回-1; 其中,dalaytime: 单位ms;
note: 

1. 当delaytime为0时,表示forever,永不退回.
2. 当按ecs键时,因为esc键ASCII值为27,所有returnvalue的值为27, 一般用这个机制实现在delaytime内正常退出.
3. 也使用 if cv2.waitKey(1) & 0xFF == ord(‘q’): break
4. 来实现1ms之内的正常退出.
5. 其中, ord(‘q’)：返回q对应的Unicode码对应的值，q对应的Unicode数值为113。
6. 0xFF：0xFF是一个位掩码，十六进制常数，二进制值为11111111, 它将左边的24位设置为0,把返回值限制在在0和255之间。ord(’ ')返回按键对应的整数（ASCII码）
### 1.12 保存图像
```python
    #cv2.IMWRITE_JPEG_QUALITY的值默认是long，需要强制转为int
	#对于img格式，其质量为0-100的范围，其中默认是95
    cv2.imwrite("./5.jpg", img, [int(cv2.IMWRITE_JPEG_QUALITY), 5])
    cv2.imwrite("./100.jpg", img, [int(cv2.IMWRITE_JPEG_QUALITY), 100])
	#对于png格式，其质量为0-9范围，其中默认是3
    cv2.imwrite("./0.png", img, [int(cv2.IMWRITE_PNG_COMPRESSION), 0])
    cv2.imwrite("./9.png", img, [int(cv2.IMWRITE_PNG_COMPRESSION), 9])
```
```python
import cv2
 
# 待检测的图片路径
imagepath="1.jpg"
 
image = cv2.imread(imagepath)
gray = cv2.cvtColor(image,cv2.COLOR_BGR2GRAY)

# 获取人脸识别训练数据
#对于人脸特征的一些描述，opencv在读取完数据后很据训练中的样品数据，
#就可以感知读取到的图片上的特征，进而对图片进行人脸识别。
#xml数据下载：https://github.com/opencv/opencv/tree/master/data/haarcascades

face_cascade = cv2.CascadeClassifier(r'./haarcascade_frontalface_default.xml')
 
# 探测人脸
# 根据训练的数据来对新图片进行识别的过程。
faces = face_cascade.detectMultiScale(
  gray,
  scaleFactor = 1.15,
  minNeighbors = 5,
  minSize = (5,5),
  #flags = cv2.HAAR_SCALE_IMAGE
)
 
# 我们可以随意的指定里面参数的值，来达到不同精度下的识别。返回值就是opencv对图片的探测结果的体现。
 
# 处理人脸探测的结果
print ("发现{0}个人脸!".format(len(faces)))
for(x,y,w,h) in faces:
    cv2.rectangle(image,(x,y),(x+w,y+w),(0,255,0),2)
    # cv2.circle(image,((x+x+w)/2,(y+y+h)/2),w/2,(0,255,0),2)
 
cv2.imshow("image",image)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

## 2. Haar级联分类器
### 2.1 种类
顾名思义——

```
haarcascade_eye.xml
haarcascade_eye_tree_eyeglasses.xml
haarcascade_frontalface_alt.xml
haarcascade_frontalface_alt_tree.xml
haarcascade_frontalface_alt2.xml
haarcascade_frontalface_default.xml
haarcascade_fullbody.xml
haarcascade_lefteye_2splits.xml
haarcascade_lowerbody.xml
haarcascade_mcs_eyepair_big.xml
haarcascade_mcs_eyepair_small.xml
haarcascade_mcs_leftear.xml
haarcascade_mcs_lefteye.xml
haarcascade_mcs_mouth.xml
haarcascade_mcs_nose.xml
haarcascade_mcs_rightear.xml
haarcascade_mcs_righteye.xml
haarcascade_mcs_upperbody.xml
haarcascade_profileface.xml
haarcascade_righteye_2splits.xml
haarcascade_smile.xml
haarcascade_upperbody.xml
```
### 2.2 detectMultiScale函数
函数原型
```python
objects = cv2.CascadeClassifier.detectMultiScale( image[, scaleFactor[,￼   minNeighbors[, flags[, minSize[, maxSize]]]]] )
```

检测人脸和眼睛应该出现的位置


| image        | 待检测图像，通常设置为灰度图像                               |
| ------------ | ------------------------------------------------------------ |
| scaleFactor  | 窗口缩放的比例                                               |
| minNeighbors | 检测的目标相邻矩形的最小个数，默认三，如果希望检测严格可以调高 |
| flags        | 边缘检测器，拒绝一些区域                                     |
| minSize      | 最小尺寸，小于这个尺寸的可以忽略                             |
| naxSize      | 最大尺寸，大于这个尺寸的可以忽略                             |

### 2.3 ~~LBPH识别~~

~~retval = cv2.face.LBPHFaceRecognizer_create( [, radius[, neighbors[,￼grid_x[, grid_y[, threshold]]]]])~~

~~方法：PCA~~

~~暂时并不需要完成识别，只需要检测~~

## 3.识别
导入haarcascade_eye.xml和haarcascade_frontalface_default.xml

在Github下载

```python
fileUrl=https://github.com/opencv/opencv
```

### 3.1 人脸导入以及灰度处理

```python
import cv2
# 载入人脸识别和眼睛识别的两个xml文件
face_xml = cv2.CascadeClassifier('haarcascade_frontalface_default.xml')
eye_xml = cv2.CascadeClassifier('haarcascade_eye.xml')
# 载入图片
img = cv2.imread('face.jpg')
cv2.imshow('src', img)
# 灰度处理
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
```



### 3.2 识别人脸并且用方框标记
```python
# 人脸识别
face = face_xml.detectMultiScale(gray, 1.3, 2)  # 参数：1、灰度图片， 2、缩放比例， 3、阈值
print("这张图片中有%d张人脸" % len(face))
# 绘制出识别到的人脸
for (x, y, w, h) in face:
    cv2.rectangle(img, (x, y), (x+w, y+h), (0, 255, 0), 2)  # 绘制人脸方框
    cv2.imshow('dst', img)
    cv2.waitkey(0)

```

### 3.3 识别眼睛并用方框标记
```python
# 在人脸的基础上识别眼睛
    face_gray = gray[y:y+h, x:x+w]
    face_color = img[y:y+h, x:x+w]
    # 眼睛识别
    eyes = eye_xml.detectMultiScale(face_gray)
    print("在这张脸上有%d个眼睛" % len(eyes))
    # 绘制出识别到的眼睛
    for (e_x, e_y, e_w, e_h) in eyes:
        cv2.rectangle(face_color, (e_x, e_y), (e_x+e_w, e_y+e_h), (0, 255, 0), 2)  # 绘制眼睛方框
```
### 3.4 对图片进行完整处理
```python
# -*- coding: utf-8 -*-
#@Time : 2020-10-17 18:38
#@Author : Jiancong Zhu
#@Email : 643601464@qq.com
#@File : test01.py
#@Software: PyCharm
# from PIL import Image

__author__ = 'WWQ'

import cv2
# 载入人脸识别和眼睛识别的两个xml文件
face_xml = cv2.CascadeClassifier('haarcascade_frontalface_default.xml')
eye_xml = cv2.CascadeClassifier('haarcascade_eye.xml')
# 载入图片
img = cv2.imread('face.jpg')
cv2.imshow('src', img)
# 灰度处理
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
# 人脸识别
face = face_xml.detectMultiScale(gray, 1.3, 2)  # 参数：1、灰度图片， 2、缩放比例， 3、阈值
print("这张图片中有%d张人脸" % len(face))
# 绘制出识别到的人脸
for (x, y, w, h) in face:
    cv2.rectangle(img, (x, y), (x+w, y+h), (0, 255, 0), 2)  # 绘制人脸方框
    # cv2.imshow('dst', img)
    # 在人脸的基础上识别眼睛
    face_gray = gray[y:y+h, x:x+w]
    face_color = img[y:y+h, x:x+w]
    # 眼睛识别
    eyes = eye_xml.detectMultiScale(face_gray)
    print("在这张脸上有%d个眼睛" % len(eyes))
    # 绘制出识别到的眼睛
    for (e_x, e_y, e_w, e_h) in eyes:
        cv2.rectangle(face_color, (e_x, e_y), (e_x+e_w, e_y+e_h), (0, 255, 0), 2)  # 绘制眼睛方框
cv2.imshow('dst', img)
cv2.waitKey(0)
```
### 3.5 检测画面中人脸的个数
```python
# -*- coding: utf-8 -*-
#@Time : 2020-10-17 18:38
#@Author : Jiancong Zhu
#@Email : 643601464@qq.com
#@File : test01.py
#@Software: PyCharm
# from PIL import Image
import cv2
 
# 待检测的图片路径
imagepath="test01.jpg"
 
image = cv2.imread(imagepath)
gray = cv2.cvtColor(image,cv2.COLOR_BGR2GRAY)
 
 
'''
# 获取人脸识别训练数据
对于人脸特征的一些描述，opencv在读取完数据后很据训练中的样品数据，
就可以感知读取到的图片上的特征，进而对图片进行人脸识别。
xml数据下载，
参考：https://github.com/opencv/opencv/tree/master/data/haarcascades
'''
face_cascade = cv2.CascadeClassifier(r'./haarcascade_frontalface_default.xml')
 
# 探测人脸
# 根据训练的数据来对新图片进行识别的过程。
faces = face_cascade.detectMultiScale(
  gray,
  scaleFactor = 1.15,
  minNeighbors = 5,
  minSize = (5,5),
  #flags = cv2.HAAR_SCALE_IMAGE
)
 
# 我们可以随意的指定里面参数的值，来达到不同精度下的识别。返回值就是opencv对图片的探测结果的体现。
 
# 处理人脸探测的结果
print ("发现{0}个人脸!".format(len(faces)))
for(x,y,w,h) in faces:
    cv2.rectangle(image,(x,y),(x+w,y+w),(0,255,0),2)
    # cv2.circle(image,((x+x+w)/2,(y+y+h)/2),w/2,(0,255,0),2)
 
cv2.imshow("image",image)
cv2.waitKey(0)
cv2.destroyAllWindows()
```
## 4.提取人眼区域的瞳孔位置
### 4.1 提取人眼的位置，并且二值化

```python
# -*- coding: utf-8 -*-
#@Time : 2020-10-17 19:27
#@Author : Jiancong Zhu
#@Email : 643601464@qq.com
#@File : test01.py
#@Software: PyCharm
# from PIL import Image

import cv2
import numpy as np

src = cv2.imread("/home/jon/code/python/img/eye_area.jpg")
gray = cv2.cvtColor(src, cv.COLOR_BGR2GRAY)
cv2.imshow("gray image", gray)
ret,binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)
cv2.imshow("binary image", binary)
```
### 4.2 对其降噪处理
要想得到眼球，我们可以通过一个圆形的结构元素，对这张图像做个开操作(先腐蚀再膨胀)，但是还存在一个问题，中心的圆形区域还存在噪声，需要先把这个噪声剔除![在这里插入图片描述](https://img-blog.csdnimg.cn/20190425160356134.JPG)
```python
element1 = cv2.getStructuringElement(cv2.MORPH_RECT,(3,3),(-1,-1))
tmp = cv2.morphologyEx(binary,cv2.MORPH_CLOSE,element1,None,(-1,-1),1)
cv2.imshow("tmp image", tmp)
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20190425161034606.JPG)这样图像就干净了，去除了噪声后，我们也就可以通过圆形的结构元素提取眼球位置
注意：这里的矩形结构元素不能太大了，不然会把里面的2个大黑点当作噪声去除了，从而导致找不到眼球

```python
element2 = cv.getStructuringElement(cv.MORPH_ELLIPSE,(16,16),(-1,-1))
dst = cv.morphologyEx(tmp,cv.MORPH_OPEN,element2)
cv.imshow("eye image", dst)
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20190425161314888.JPG)如图得到眼球，下面只需要来个轮廓发现并填充颜色即可
注意：这里的圆形区域的大小需要适当大点，或许需要根据不同的图片坐下微调以达到理想的效果

```python
cloneImage, contours, hierarchy = cv2.findContours(dst, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE, None, None, (0, 0))
for i, contour in enumerate(contours):
    print "find "
    cv2.drawContours(src, contours, i, (255, 0, 0), -1)

cv2.imshow("dst image", src)

```
### 4.3 完整判断眼睛代码
```python
#-*- coding = utf-8 -*-
#@Time : 2020-10-17 18:38
#@Author : Jiancong Zhu
#@Email : 643601464@qq.com
#@File : test01.py
#@Software: PyCharm
# from PIL import Image
import cv2 
import numpy as np

src = cv2.imread("/home/jon/code/python/img/tpl.jpg")
gray = cv2.cvtColor(src, cv2.COLOR_BGR2GRAY)
cv2.imshow("gray image", gray)
ret,binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)
cv2.imshow("binary image", binary)

element1 = cv2.getStructuringElement(cv2.MORPH_RECT,(3,3),(-1,-1))
tmp = cv2.morphologyEx(binary,cv2.MORPH_CLOSE,element1,None,(-1,-1),1)
cv2.imshow("tmp image", tmp)

element2 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(16,16),(-1,-1))
dst = cv2.morphologyEx(tmp,cv.MORPH_OPEN,element2)
cv2.imshow("eye image", dst)

cloneImage, contours, hierarchy = cv2.findContours(dst, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE, None, None, (0, 0))
for i, contour in enumerate(contours):
    print "find "
    cv2.drawContours(src, contours, i, (255, 0, 0), -1)

cv2.imshow("dst image", src)

cv2.waitKey(0)
cv2.destroyAllWindows()
```

## 5. 视频操作
### 5.1 读取视频

```python
import cv2
cap = cv2. VideoCapture (0)
while True:
    ret, frame = cap. read()
    cv2. imshow(' Video',frame)
    C = cv2. waitKey(1)
    if c == 27:
        break
cap.release()
cv2.destroyAllWindows()
```

1、cap = cv2.VideoCapture(0)

VideoCapture()中参数是0，表示打开笔记本的内置摄像头，参数是视频文件路径则打开视频，如cap = cv2.VideoCapture("../test.avi")

2、ret,frame = cap.read()

 cap.read()按帧读取视频，ret,frame是获cap.read()方法的两个返回值。其中`ret`是布尔值，如果读取帧是正确的则返回True，如果文件读取到结尾，它的返回值就为False。`frame`就是每一帧的图像，是个三维矩阵。

3、cv2.waitKey(1)，waitKey（）方法本身表示等待键盘输入，

参数是1，表示延时1ms切换到下一帧图像，对于视频而言；

参数为0，如cv2.waitKey(0)只显示当前帧图像，相当于视频暂停,；

参数过大如cv2.waitKey(1000)，会因为延时过久而卡顿感觉到卡顿。

c得到的是键盘输入的ASCII码，esc键对应的ASCII码是27，即当按esc键是if条件句成立

4、调用release()释放摄像头，调用destroyAllWindows()关闭所有图像窗口。

### 5.2 将视频的每一帧识别出人像

将上述的方法整合
即可实现每一帧的视频中的图像展示出来
示例代码如下

```python
#-*- coding = utf-8 -*-
#@Time : 2020-10-19 16:32
#@Author : Jiancong Zhu
#@Email : 643601464@qq.com
#@File : videoOpen.py
#@Software: PyCharm
import cv2
dataFaceUrl = r'E:\opencv\opencv-master\data\haarcascades\haarcascade_frontalface_default.xml'
dataEyesUrl = r'E:\opencv\opencv-master\data\haarcascades\haarcascade_eye.xml'
videoUrl=r'D:\Desktop\python\demo\testOpencv\video1.mp4'
eye_cascade = cv2.CascadeClassifier(dataEyeUrl)
face_cascade = cv2.CascadeClassifier(dataFaceUrl)
def main():
    cap=cv2.VideoCapture(videoUrl)
    while True:
        ret,frame=cap.read()
        # cv2.imshow('video',frame)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        BBox = face_cascade.detectMultiScale(gray, 1.3, 5)
        for (x, y, w, h) in BBox:
            frame = cv2.rectangle(frame, (x, y), (x + w, y + h), (255, 0, 0), 2)
        height, width = frame.shape[:2]
        reSize2 = cv2.resize(frame, (int(width / 2), int(height / 2)), interpolation=cv2.INTER_CUBIC)
        cv2.imshow('release', reSize2)
        c = cv2.waitKey(100//30)#假定视频文件30帧
        if c==27:#按下esc退出
            break
    cap.release()
    cv2.destroyAllWindows()
if __name__ == "__main__":
    main()
```
### 5.3 识别人脸中的眼睛是否完整

```python
def eyesDetect(x, y, w, h,img,gray):
    face_gray = gray[y:y + h, x:x + w]
    face_color = img[y:y + h, x:x + w]
    # 眼睛识别
    eyes = eye_cascade.detectMultiScale(face_gray)
    # 绘制出识别到的眼睛
    for (e_x, e_y, e_w, e_h) in eyes:
        cv2.rectangle(face_color, (e_x, e_y), (e_x + e_w, e_y + e_h), (0, 255, 0), 2) 
        # 绘制眼睛方框
    cv2.destroyAllWindows()
```
### 5.4 识别人脸及眼睛代码
```python
#-*- coding = utf-8 -*-
#@Time : 2020-10-19 16:32
#@Author : Jiancong Zhu
#@Email : 643601464@qq.com
#@File : videoOpen.py
#@Software: PyCharm

import cv2
dataFaceUrl = r'E:\opencv\opencv-master\data\haarcascades\haarcascade_frontalface_default.xml'
dataEyeUrl = r'E:\opencv\opencv-master\data\haarcascades\haarcascade_eye.xml'
videoUrl=r'D:\Desktop\whx.mp4'
eyeCascade = cv2.CascadeClassifier(dataEyeUrl)
faceCascade = cv2.CascadeClassifier(dataFaceUrl)

def main():
    # cap=cv2.VideoCapture(0)
    cap = cv2.VideoCapture(videoUrl)
    while True:
        flag,frame=cap.read()
        if not flag:
            break
        flag1=1#代表眼睛数目正常
        flag2=1#代表脸部数目正常
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)#灰化，转为黑白
        faces = faceCascade.detectMultiScale(gray, 1.3, 6,minSize=(150,150))#返回四维列表，最小大小暂时设置为150，防止误识别，后期可以再修改
        if(len(faces)==1):
            for (x, y, w, h) in faces:
                frame = cv2.rectangle(frame, (x, y), (x + w, y + h), (255, 0, 0), 2)
                faceGray = gray[y:y + int(h*2/3), x:x + w]#这里取脸部上方2/3，为了防止误识别嘴巴
                faceFrame = frame[y:y + int(h*2/3), x:x + w]
                eyes = eyeCascade.detectMultiScale(faceGray,1.3,7)
                if(len(eyes)==2):
                    for (e_x, e_y, e_w, e_h) in eyes:
                        cv2.rectangle(faceFrame, (e_x, e_y), (e_x + e_w, e_y + e_h), (0, 255, 0), 2)
                else:
                    flag1=0#代表眼睛个数不为2
        else:
            flag2=0#代表眼睛个数不为1
        if flag1==1 and flag2==1:#只有当脸的个数为1，眼睛数为2，输出
            cv2.putText(frame,"ok",(30,50),cv2.FONT_HERSHEY_SIMPLEX,3,(0,255,0))
        else:
            cv2.putText(frame,"error",(30,50),cv2.FONT_HERSHEY_SIMPLEX,3,(0,0,255))
        height, width = frame.shape[:2]
        reSize2 = cv2.resize(frame, (int(width / 1.3), int(height / 1.3)), interpolation=cv2.INTER_CUBIC)
        cv2.imshow('release', reSize2)
        esc = cv2.waitKey(3)
        if esc == 27:
            break
    cv2.distoryAllWindows()
    cap.release()

if __name__ == "__main__":
    main()
```
