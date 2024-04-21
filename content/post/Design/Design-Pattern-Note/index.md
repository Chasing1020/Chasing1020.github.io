---
title: "Design Pattern Note"
date: 2021-06-01T10:18:40+08:00
lastmod: 2021-06-01T10:18:40+08:00
draft: false
author: "Chasing1020"
comment: true
keywords: []
description: ""
tags: ['Design Pattern']
categories: ['Note']
image: "design-pattern.webp"
---

# Design Pattern

## 1. Creational Patterns

### 1.1.Factory Method

**工厂方法模式**是一种创建型设计模式， 其在父类中提供一个创建对象的方法， 允许子类决定实例化对象的类型。

#### Usage
1. 无法预知对象确切类别及其依赖关系。（只需要开发新的创建者子类， 然后重写其工厂方法）
2. 希望用户能扩展软件库或框架的内部组件。
3. 如果希望复用现有对象来节省系统资源， 而不是每次都重新创建对象。

#### Advantages
1. 避免创建者和具体产品之间的紧密耦合。
2. 单一职责原则。 将产品创建代码放在程序的单一位置， 从而使得代码更容易维护。
3. 开闭原则。 无需更改现有客户端代码， 可以在程序中引入新的产品类型。

#### Disadvantages
1. 应用工厂方法模式需要引入许多新的子类， 代码可能会因此变得更复杂。 最好的情况是将该模式引入创建者类的现有层次结构中。

#### Demo

```java
public abstract class NumberFormat extends Format {
  
    private static NumberFormat getInstance(Locale desiredLocale,
                                           int choice) {
        LocaleProviderAdapter adapter;
        adapter = LocaleProviderAdapter.getAdapter(NumberFormatProvider.class,
                                                   desiredLocale);
        NumberFormat numberFormat = getInstance(adapter, desiredLocale, choice);
        if (numberFormat == null) {
            numberFormat = getInstance(LocaleProviderAdapter.forJRE(),
                                       desiredLocale, choice);
        }
        return numberFormat;
    }
    private static NumberFormat getInstance(LocaleProviderAdapter adapter,
                                            Locale locale, int choice) {
        NumberFormatProvider provider = adapter.getNumberFormatProvider();
        NumberFormat numberFormat = null;
        switch (choice) {
        case NUMBERSTYLE:
            numberFormat = provider.getNumberInstance(locale);
            break;
        case PERCENTSTYLE:
            numberFormat = provider.getPercentInstance(locale);
            break;
        case CURRENCYSTYLE:
            numberFormat = provider.getCurrencyInstance(locale);
            break;
        case INTEGERSTYLE:
            numberFormat = provider.getIntegerInstance(locale);
            break;
        }
        return numberFormat;
    }
}
```



```java
// Calendar 三个子类，都可以调用getInstance() -> createClendar
// BuddhistCalendar
// GregorianCalendar
// JapaneseImperialCalendar
    private static Calendar createCalendar(TimeZone zone,
                                           Locale aLocale)
    {
        CalendarProvider provider =
            LocaleProviderAdapter.getAdapter(CalendarProvider.class, aLocale)
                                 .getCalendarProvider();
        if (provider != null) {
            try {
                return provider.getInstance(zone, aLocale);
            } catch (IllegalArgumentException iae) {
                // fall back to the default instantiation
            }
        }

        Calendar cal = null;

        if (aLocale.hasExtensions()) {
            String caltype = aLocale.getUnicodeLocaleType("ca");
            if (caltype != null) {
                switch (caltype) {
                case "buddhist":
                cal = new BuddhistCalendar(zone, aLocale);
                    break;
                case "japanese":
                    cal = new JapaneseImperialCalendar(zone, aLocale);
                    break;
                case "gregory":
                    cal = new GregorianCalendar(zone, aLocale);
                    break;
                }
            }
        }
        if (cal == null) {
            // If no known calendar type is explicitly specified,
            // perform the traditional way to create a Calendar:
            // create a BuddhistCalendar for th_TH locale,
            // a JapaneseImperialCalendar for ja_JP_JP locale, or
            // a GregorianCalendar for any other locales.
            // NOTE: The language, country and variant strings are interned.
            if (aLocale.getLanguage() == "th" && aLocale.getCountry() == "TH") {
                cal = new BuddhistCalendar(zone, aLocale);
            } else if (aLocale.getVariant() == "JP" && aLocale.getLanguage() == "ja"
                       && aLocale.getCountry() == "JP") {
                cal = new JapaneseImperialCalendar(zone, aLocale);
            } else {
                cal = new GregorianCalendar(zone, aLocale);
            }
        }
        return cal;
    }
```
### 1.2.Abstract Factory

**抽象工厂模式**是一种创建型设计模式， 它能创建一系列相关的对象， 而无需指定其具体类。

#### Usage

1. 如果代码需要与多个不同系列的相关产品交互， 但是由于无法提前获取相关信息， 或者出于对未来扩展性的考虑， 不希望代码基于产品的具体类进行构建， 在这种情况下， 可以使用抽象工厂。
2. 如果有一个基于一组抽象方法的类， 且其主要功能因此变得不明确， 那么在这种情况下可以考虑使用抽象工厂模式。

#### Advantages
1. 可以确保同一工厂生成的产品相互匹配。
2. 可以避免客户端和具体产品代码的耦合。
3. 单一职责原则。 可以将产品生成代码抽取到同一位置， 使得代码易于维护。
4. 开闭原则。 向应用程序中引入新产品变体时， 无需修改客户端代码。

#### Disadvantages
1. 由于采用该模式需要向应用中引入众多接口和类， 代码可能会比之前更加复杂。

#### Demo

```java
// 使得应用程序可以通过XML文件，获得一个能生成DOM对象的解析器。
public abstract class DocumentBuilderFactory {
    //...   
    public static DocumentBuilderFactory newInstance() {
        return FactoryFinder.find(
                /* The default property name according to the JAXP spec */
                DocumentBuilderFactory.class, // "javax.xml.parsers.DocumentBuilderFactory"
                /* The fallback implementation class name */
                "com.sun.org.apache.xerces.internal.jaxp.DocumentBuilderFactoryImpl");
    }
}

public class DocumentBuilderFactoryImpl extends DocumentBuilderFactory {
    public DocumentBuilder newDocumentBuilder() throws ParserConfigurationException {
        /** Check that if a Schema has been specified that neither of the schema properties have been set. */
        if (grammar != null && attributes != null) {
            if (attributes.containsKey(JAXPConstants.JAXP_SCHEMA_LANGUAGE)) {
                throw new ParserConfigurationException(
                        SAXMessageFormatter.formatMessage(null,
                        "schema-already-specified", new Object[] {JAXPConstants.JAXP_SCHEMA_LANGUAGE}));
            }
            else if (attributes.containsKey(JAXPConstants.JAXP_SCHEMA_SOURCE)) {
                throw new ParserConfigurationException(
                        SAXMessageFormatter.formatMessage(null,
                        "schema-already-specified", new Object[] {JAXPConstants.JAXP_SCHEMA_SOURCE}));
            }
        }

        try {
            return new DocumentBuilderImpl(this, attributes, features, fSecureProcess);
        } catch (SAXException se) {
            // Handles both SAXNotSupportedException, SAXNotRecognizedException
            throw new ParserConfigurationException(se.getMessage());
        }
    }
}
```


### 1.3.Builder

构建器模式是一种创建型设计模式， 使能够分步骤创建复杂对象。 该模式允许使用相同的创建代码生成不同类型和形式的对象。

#### Usage
1. 使用生成器模式可避免 “重叠构造函数 （telescopic constructor）” 的出现。
2. 当希望使用代码创建不同形式的产品 （例如石头或木头房屋） 时， 可使用生成器模式。
3. 使用生成器构造组合树或其他复杂对象。

#### Advantages
1. 可以分步创建对象， 暂缓创建步骤或递归运行创建步骤。
2. 生成不同形式的产品时， 可以复用相同的制造代码。
3. 单一职责原则。 可以将复杂构造代码从产品的业务逻辑中分离出来。

#### Disadvantages
1. 由于该模式需要新增多个类， 因此代码整体复杂程度会有所增加。

#### Demo

```java
public final class StringBuilder
    extends AbstractStringBuilder
    implements java.io.Serializable, CharSequence
{
    @Override
    public StringBuilder append(Object obj) {
        return append(String.valueOf(obj));
    }
    @Override
    public StringBuilder append(String str) {
        super.append(str);
        return this;
    }
}
```


### 1.4.Prototype

原型模式是一种创建型设计模式， 使能够复制已有对象， 而又无需使代码依赖它们所属的类。

#### Usage
1. 如果需要复制一些对象， 同时又希望代码独立于这些对象所属的具体类， 可以使用原型模式。
2. 如果子类的区别仅在于其对象的初始化方式， 那么可以使用该模式来减少子类的数量。 别人创建这些子类的目的可能是为了创建特定类型的对象。

#### Advantages
1. 可以克隆对象， 而无需与它们所属的具体类相耦合。
2. 可以克隆预生成原型， 避免反复运行初始化代码。
3. 可以更方便地生成复杂对象，在内存中创建性能更好。
4. 可以用继承以外的方式来处理复杂对象的不同配置。

#### Disadvantages
1. 克隆包含循环引用的复杂对象可能会非常麻烦。
#### Demo
```java
public interface Cloneable {
}
public class Object {
    protected native Object clone() throws CloneNotSupportedException;
}

class Prototype implements Cloneable {
    public Prototype clone() {
        Prototype prototype = null;
        try{
            prototype = (Prototype)super.clone();
        }catch(CloneNotSupportedException e) {
            e.printStackTrace();
        }
        return prototype; 
    }
}
class ConcretePrototype extends Prototype {
    public void show() {
        System.out.println("原型模式实现类");
    }
}
public class Client {
      public static void main(String[] args) {
            ConcretePrototype cp = new ConcretePrototype();
            for(int i=0; i< 10; i++) {
            // 返回浅拷贝对象
                  ConcretePrototype clonecp = (ConcretePrototype)cp.clone();
                  clonecp.show();
            }
      }
}
```

### 1.5.Singleton
单例模式是一种创建型设计模式， 让能够保证一个类只有一个实例， 并提供一个访问该实例的全局节点。

#### Usage
1. 如果程序中的某个类对于所有客户端只有一个可用的实例， 可以使用单例模式。
2. 如果需要更加严格地控制全局变量， 可以使用单例模式。

#### Advantages
1. 可以保证一个类只有一个实例。
2. 获得了一个指向该实例的全局访问节点。
3. 仅在首次请求单例对象时对其进行初始化。
#### Disadvantages
1. 违反了_单一职责原则_。 该模式同时解决了两个问题。
2. 单例模式可能掩盖不良设计， 比如程序各组件之间相互了解过多等。
3. 该模式在多线程环境下需要进行特殊处理， 避免多个线程多次创建单例对象。
4. 单例的客户端代码单元测试可能会比较困难， 因为许多测试框架以基于继承的方式创建模拟对象。 由于单例类的构造函数是私有的， 而且绝大部分语言无法重写静态方法， 所以需要想出仔细考虑模拟单例的方法。 要么干脆不编写测试代码， 或者不使用单例模式。

```java
public final class Singleton {
    private static Singleton instance;
    public String value;

    private Singleton(String value) {
        // The following code emulates slow initialization.
        try {
            Thread.sleep(1000);
        } catch (InterruptedException ex) {
            ex.printStackTrace();
        }
        this.value = value;
    }

    public static Singleton getInstance(String value) {
        if (instance == null) {
            instance = new Singleton(value);
        }
        return instance;
    }
}
```
多线程安全
```java
public final class Singleton {

    private static volatile Singleton instance;
    public String value;
    private Singleton(String value) {
        this.value = value;
    }
    public static Singleton getInstance(String value) {
        Singleton result = instance;
        if (result != null) {
            return result;
        }
        synchronized(Singleton.class) {
            if (instance == null) {
                instance = new Singleton(value);
            }
            return instance;
        }
    }
}
```
静态内部类单例模式（推荐）
```java
//推荐写法
public class Singleton { 
    private Singleton(){
    }
    public static Singleton getInstance(){  
        return SingletonHolder.sInstance;  //静态内部类完成加载
    }  
    private static class SingletonHolder {  
        private static final Singleton sInstance = new Singleton();  
    }  
} 
```
核心库示例
```java
public class Runtime {
    private static Runtime currentRuntime = new Runtime();
    public static Runtime getRuntime() {
        return currentRuntime;
    }
}
```
```java
public final class System {
    private static native void registerNatives();
    private static volatile SecurityManager security = null;
    static {
        registerNatives();
    }

    /** Don't let anyone instantiate this class */
    private System() {
    }

    public static SecurityManager getSecurityManager() {
        return security;
    }
}
````

```GO
package main

import (
    "fmt"
    "sync"
)

var lock = &sync.Mutex{}

type single struct {
}

var singleInstance *single

func getInstance() *single {
    if singleInstance == nil {
        lock.Lock()
        defer lock.Unlock()
        if singleInstance == nil {
            fmt.Println("Creting Single Instance Now")
            singleInstance = &single{}
        } else {
            fmt.Println("Single Instance already created-1")
        }
    } else {
        fmt.Println("Single Instance already created-2")
    }
    return singleInstance
}
```



## 2. Structural Patterns

### 2.1.Adapter
适配器模式是一种结构型设计模式， 它能使接口不兼容的对象能够相互合作。

#### Usage
1. 当希望使用某个类， 但是其接口与其他代码不兼容时， 可以使用适配器类。
2. 如果您需要复用这样一些类， 他们处于同一个继承体系， 并且他们又有了额外的一些共同的方法， 但是这些共同的方法不是所有在这一继承体系中的子类所具有的共性。

#### Advantages
1. 单一职责原则。可以将接口或数据转换代码从程序主要业务逻辑中分离。
2. 开闭原则。 只要客户端代码通过客户端接口与适配器进行交互， 就能在不修改现有客户端代码的情况下在程序中添加新类型的适配器。

#### Disadvantages
1. 代码整体复杂度增加， 因为需要新增一系列接口和类。 有时直接更改服务类使其与其他代码兼容会更简单。


#### Demo
```java
//ArrayList 和 T[]是组合关系，想将T[]转换成list的操作，要有一个适配器来进行转换
public class Arrays {
    private static class ArrayList<E> extends AbstractList<E>
        implements RandomAccess, java.io.Serializable {
        @Override
        @SuppressWarnings("unchecked")
        public <T> T[] toArray(T[] a) {
            int size = size();
            if (a.length < size)
                return Arrays.copyOf(this.a, size,
                                     (Class<? extends T[]>) a.getClass());
            System.arraycopy(this.a, 0, a, 0, size);
            if (a.length > size)
                a[size] = null;
            return a;
        }
    }
    @SafeVarargs
    @SuppressWarnings("varargs")
    public static <T> List<T> asList(T... a) {
        return new ArrayList<>(a);
    }
}
```
InputStreamReader也作为适配器使用
```java
// 目标类
public abstract class Reader implements Readable, Closeable {
      // 字符流
    abstract public int read(char cbuf[], int off, int len) throws IOException;
    abstract public void close() throws IOException;
}
// 适配器类
public class InputStreamReader extends Reader {
    private final StreamDecoder sd;
    public InputStreamReader(InputStream in) {
        super(in);
        try {
            //通过StreamDecoder类间接引用被适配的对象
            sd = StreamDecoder.forInputStreamReader(in, this, (String)null);
        } catch (UnsupportedEncodingException e) {
            // The default encoding should always be available
            throw new Error(e);
        }
    }
}
// 被适配的类
public abstract class InputStream implements Closeable {
    // 字节流
    public int read(byte b[]) throws IOException {
        return read(b, 0, b.length);
    }
}
```

### 2.2.Bridge
桥接模式是一种结构型设计模式， 可将一个大类或一系列紧密相关的类拆分为抽象和实现两个独立的层次结构， 从而能在开发时分别使用。

#### Usage

1. 如果想要拆分或重组一个具有多重功能的庞杂类 （例如能与多个数据库服务器进行交互的类）， 可以使用桥接模式。
2. 如果希望在几个独立维度上扩展一个类， 可使用该模式。
3. 如果需要在运行时切换不同实现方法， 可使用桥接模式。

#### Advantages
1. 可以创建与平台无关的类和程序，将抽象与实现解耦。
2. 客户端代码仅与高层抽象部分进行互动， 不会接触到平台的详细信息。
3. 开闭原则。 可以新增抽象部分和实现部分， 且它们之间不会相互影响。
4. 单一职责原则。 抽象部分专注于处理高层逻辑， 实现部分处理平台细节。
#### Disadvantages
1. 对高内聚的类使用该模式可能会让代码更加复杂。

#### Demo

```java
// JDBC
public interface Driver {
    Connection connect(String url, java.util.Properties info) throws SQLException;
    boolean acceptsURL(String url) throws SQLException;
    DriverPropertyInfo[] getPropertyInfo(String url, java.util.Properties info) throws SQLException;
    int getMajorVersion();
    int getMinorVersion();
    boolean jdbcCompliant();
    public Logger getParentLogger() throws SQLFeatureNotSupportedException;
}

public class Driver extends NonRegisteringDriver implements java.sql.Driver {
    public Driver() throws SQLException {
    }
    static {
        try {
            DriverManager.registerDriver(new Driver());
        } catch (SQLException var1) {
            throw new RuntimeException("Can't register driver!");
        }
    }
}

// 桥
public class DriverManager{
    public static Connection getConnection(String url,
        String user, String password) throws SQLException {
        java.util.Properties info = new java.util.Properties();
        if (user != null) {
            info.put("user", user);
        }
        if (password != null) {
            info.put("password", password);
        }
        return (getConnection(url, info, Reflection.getCallerClass()));
    }
}
```


### 2.3.Composite
组合模式是一种结构型设计模式， 可以使用它将对象组合成树状结构， 并且能像使用独立对象一样使用它们。

#### Usage
1.  如果需要实现树状对象结构， 可以使用组合模式。
2.  如果希望客户端代码以相同方式处理简单和复杂元素， 可以使用该模式。

#### Advantages
1. 可以利用多态和递归机制更方便地使用复杂树结构。
2. 开闭原则。 无需更改现有代码， 就可以在应用中添加新元素， 使其成为对象树的一部分。
#### Disadvantages
1. 对于功能差异较大的类， 提供公共接口或许会有困难。 在特定情况下， 需要过度一般化组件接口， 使其变得令人难以理解。

#### Demo

```java
import java.util.ArrayList;
import java.util.List;
 
public class Employee {
    private String name;
    private String dept;
    private int salary;
    private List<Employee> subordinates;

   //构造函数
    public Employee(String name,String dept, int sal) {
        this.name = name;
        this.dept = dept;
        this.salary = sal;
        subordinates = new ArrayList<Employee>();
    }
 
    public void add(Employee e) {
        subordinates.add(e);
    }
 
    public void remove(Employee e) {
        subordinates.remove(e);
    }
 
    public List<Employee> getSubordinates(){
       return subordinates;
    }
 
    public String toString(){
        return ("Employee :[ Name : "+ name 
        +", dept : "+ dept + ", salary :"
        + salary+" ]");
    }   
}
```
常用于前端表示与图形打交道的用户界面组件或代码的层次结构
```java
public class Container extends Component {   
    public Component add(Component comp) {
        addImpl(comp, null, -1);
        return comp;
    }
    protected void addImpl(Component comp, Object constraints, int index) {
        synchronized (getTreeLock()) {
            GraphicsConfiguration thisGC = this.getGraphicsConfiguration();

            if (index > component.size() || (index < 0 && index != -1)) {
                throw new IllegalArgumentException(
                          "illegal component position");
            }
            checkAddToSelf(comp);
            checkNotAWindow(comp);
            /* Reparent the component and tidy up the tree's state. */
            if (comp.parent != null) {
                comp.parent.remove(comp);
                if (index > component.size()) {
                    throw new IllegalArgumentException("illegal component position");
                }
            }
            if (thisGC != null) {
                comp.checkGD(thisGC.getDevice().getIDstring());
            }
            //index == -1 means add to the end.
            if (index == -1) {
                component.add(comp);
            } else {
                component.add(index, comp);
            }
            comp.parent = this;
            comp.setGraphicsConfiguration(thisGC);

            adjustListeningChildren(AWTEvent.HIERARCHY_EVENT_MASK,
                comp.numListening(AWTEvent.HIERARCHY_EVENT_MASK));
            adjustListeningChildren(AWTEvent.HIERARCHY_BOUNDS_EVENT_MASK,
                comp.numListening(AWTEvent.HIERARCHY_BOUNDS_EVENT_MASK));
            adjustDescendants(comp.countHierarchyMembers());
            invalidateIfValid();
            if (peer != null) {
                comp.addNotify();
            }
            /* Notify the layout manager of the added component. */
            if (layoutMgr != null) {
                if (layoutMgr instanceof LayoutManager2) {
                    ((LayoutManager2)layoutMgr).addLayoutComponent(comp, constraints);
                } else if (constraints instanceof String) {
                    layoutMgr.addLayoutComponent((String)constraints, comp);
                }
            }
            if (containerListener != null ||
                (eventMask & AWTEvent.CONTAINER_EVENT_MASK) != 0 ||
                Toolkit.enabledOnToolkit(AWTEvent.CONTAINER_EVENT_MASK)) {
                ContainerEvent e = new ContainerEvent(this,
                                     ContainerEvent.COMPONENT_ADDED,
                                     comp);
                dispatchEvent(e);
            }

            comp.createHierarchyEvents(HierarchyEvent.HIERARCHY_CHANGED, comp,
                                       this, HierarchyEvent.PARENT_CHANGED,
                                       Toolkit.enabledOnToolkit(AWTEvent.HIERARCHY_EVENT_MASK));
            if (peer != null && layoutMgr == null && isVisible()) {
                updateCursorImmediately();
            }
        }
    }
}
```
混入 (mixin) 提供了一种非常灵活的方式，来分发 Vue 组件中的可复用功能。
```javascript
// 定义一个混入对象
var myMixin = {
  created: function () {
    this.hello()
  },
  methods: {
    hello: function () {
      console.log('hello from mixin!')
    }
  }
}

// 定义一个使用混入对象的组件
var Component = Vue.extend({
  mixins: [myMixin]
})

var component = new Component() // => "hello from mixin!"
```



### 2.4.Decorator

**装饰模式**是一种结构型设计模式， 允许通过将对象放入包含行为的特殊封装对象中来为原对象绑定新的行为。

#### Usage
1. 如果希望在无需修改代码的情况下即可使用对象， 且希望在运行时为对象新增额外的行为， 可以使用装饰模式。
2. 如果用继承来扩展对象行为的方案难以实现或者根本不可行， 可以使用该模式。

#### Advantages
1. 无需创建新子类即可扩展对象的行为。
2. 可以在运行时添加或删除对象的功能。
3. 可以用多个装饰封装对象来组合几种行为。
4. 单一职责原则。 可以将实现了许多不同行为的一个大类拆分为多个较小的类。

#### Disadvantages
1. 在封装器栈中删除特定封装器比较困难。
2. 实现行为不受装饰栈顺序影响的装饰比较困难。
3. 各层的初始化配置代码看上去可能会很糟糕。

#### Demo

java.io.InputStream、 OutputStream、 Reader 和 Writer 的所有代码都有以自身类型的对象作为参数的构造函数。
两者都继承了Reader抽象父类，都有自己的read方法，而在InputStreamReader中引用了一个StreamDecoder实例对象，虽然在InputStreamReader中并未对StreamDecoder的read方法添加额外的功能，但它引用StreamDecoder使用了关键字final ，让StreamDecoder不可变，从某种意义上来说它扩展的功能就是让InputStreamReader读取输入流时，编码格式不变，InputStreamReader作为一个装饰器角色。

```java
// 装饰器对象
public class InputStreamReader extends Reader {
    private final StreamDecoder sd;
    public int read() throws IOException {
        return sd.read();
    }
}

public class StreamDecoder extends Reader {
    private InputStream in;

    public int read() throws IOException {
        return this.read0();
    }

    private int read0() throws IOException {
        Object var1 = this.lock;
        synchronized(this.lock) {
            if(this.haveLeftoverChar) {
                this.haveLeftoverChar = false;
                return this.leftoverChar;
            } else {
                char[] var2 = new char[2];
                int var3 = this.read(var2, 0, 2);
                switch(var3) {
                case -1:
                    return -1;
                case 0:
                default:
                    assert false : var3;
                    return -1;
                case 2:
                    this.leftoverChar = var2[1];
                    this.haveLeftoverChar = true;
                case 1:
                    return var2[0];
                }
            }
        }
    }
}
```

### 2.5.Facade
外观模式是一种结构型设计模式， 能为程序库、 框架或其他复杂类提供一个简单的接口。

#### Usage
1. 如果需要一个指向复杂子系统的直接接口， 且该接口的功能有限， 则可以使用外观模式。
2. 如果需要将子系统组织为多层结构， 可以使用外观。

#### Advantages
1. 可以让自己的代码独立于复杂子系统。

#### Disadvantages
1. 外观可能成为与程序中所有类都耦合的上帝对象。

#### Demo
javax.faces.context.FacesContext 在底层使用了 LifeCycle、ViewHandler 和 NavigationHandler 这几个类。（但绝大多数客户端不知道）
javax.faces.context.ExternalContext 在内部使用了 ServletContext、HttpSession、 HttpServletRequest、 HttpServletResponse 和其他一些类。

微服务中，API网关的设计也是门面模式


### 2.6.Flyweight

享元模式是一种结构型设计模式， 它摒弃了在每个对象中保存所有数据的方式， 通过共享多个对象所共有的相同状态， 让能在有限的内存容量中载入更多对象。

#### Usage
1. 仅在程序必须支持大量对象且没有足够的内存容量时使用享元模式。

#### Advantages
1. 如果程序中有很多相似对象， 那么将可以节省大量内存。


#### Disadvantages
1. 可能需要牺牲执行速度来换取内存， 因为他人每次调用享元方法时都需要重新计算部分情景数据。
2. 代码会变得更加复杂。 团队中的新成员总是会问：  “为什么要像这样拆分一个实体的状态？”。

#### Demo

```java
import java.awt.*;
import java.util.HashMap;
import java.util.Map;

public class TreeFactory {
    static Map<String, TreeType> treeTypes = new HashMap<>();

    public static TreeType getTreeType(String name, Color color, String otherTreeData) {
        TreeType result = treeTypes.get(name);
        if (result == null) {
            result = new TreeType(name, color, otherTreeData);
            treeTypes.put(name, result);
        }
        return result;
    }
}

public class Forest extends JFrame {
    private List<Tree> trees = new ArrayList<>();

    public void plantTree(int x, int y, String name, Color color, String otherTreeData) {
        TreeType type = TreeFactory.getTreeType(name, color, otherTreeData);
        Tree tree = new Tree(x, y, type);
        trees.add(tree);
    }

    @Override
    public void paint(Graphics graphics) {
        for (Tree tree : trees) {
            tree.draw(graphics);
        }
    }
}
```


Integer中也使用了享元模式
```java
//在-128～127使用非常频繁，设置IntegerCache来包装
public final class Integer extends Number implements Comparable<Integer> {
        public static Integer valueOf(int i) {
        if (i >= IntegerCache.low && i <= IntegerCache.high)
            return IntegerCache.cache[i + (-IntegerCache.low)];
        return new Integer(i);
    }
}
```
### 2.7.Proxy

**代理模式**是一种结构型设计模式， 让能够提供对象的替代品或其占位符。 代理控制着对于原对象的访问， 并允许在将请求提交给对象前后进行一些处理。

#### Usage

1. 延迟初始化 （虚拟代理）。 如果有一个偶尔使用的重量级服务对象， 一直保持该对象运行会消耗系统资源时， 可使用代理模式。
2. 访问控制 （保护代理）。 如果只希望特定客户端使用服务对象， 这里的对象可以是操作系统中非常重要的部分， 而客户端则是各种已启动的程序 （包括恶意程序）， 此时可使用代理模式。
3. 本地执行远程服务 （远程代理）。 适用于服务对象位于远程服务器上的情形。
4. 记录日志请求 （日志记录代理）。 适用于当需要保存对于服务对象的请求历史记录时。 代理可以在向服务传递请求前进行记录
5. 智能引用。 可在没有客户端使用某个重量级对象时立即销毁该对象。

#### Advantages
1. 可以在客户端毫无察觉的情况下控制服务对象。
2. 如果客户端对服务对象的生命周期没有特殊要求， 可以对生命周期进行管理。
3. 即使服务对象还未准备好或不存在， 代理也可以正常工作。
4. 开闭原则。 可以在不对服务或客户端做出修改的情况下创建新代理。

#### Disadvantages
1. 代码可能会变得复杂， 因为需要新建许多类。
2. 服务响应可能会延迟。

#### Demo

```java
//javax.ejb.EJB 
public class UserServiceProxy extends UserService implements Serializable {

    public User find(Long id) {
        UserService instance = getAnAvailableInstanceFromPool();
        User result = instance.find(id);
        releaseInstanceToPool(instance);
        return result;
    }

    public Long save(User user) {
        UserService instance = getAnAvailableInstanceFromPool();
        Long result = instance.save(user);
        releaseInstanceToPool(instance);
        return result;
    }

    // ...
}
```

在MVC模式中，也大量使用代理模式

```java
@Service
public SomeServiceImpl implements SomeService{
    @AutoWired
    private SomeService someService;
    
    public void doSome(){
        someService.doSome();
    }
}
```

## 3. Behavioral Patterns

### 3.1.Chain of Responsibility
责任链模式是一种行为设计模式， 允许将请求沿着处理者链进行发送。 收到请求后， 每个处理者均可对请求进行处理， 或将其传递给链上的下个处理者。

#### Usage
1. 当程序需要使用不同方式处理不同种类请求， 而且请求类型和顺序预先未知时， 可以使用责任链模式。
2. 当必须按顺序执行多个处理者时， 可以使用该模式。
3. 如果所需处理者及其顺序必须在运行时进行改变， 可以使用责任链模式。


#### Advantages

1. 可以控制请求处理的顺序。
2. 单一职责原则。 可对发起操作和执行操作的类进行解耦。
3. 开闭原则。 可以在不更改现有代码的情况下在程序中新增处理者。

#### Disadvantages
1. 部分请求可能未被处理。

#### Demo
为系统or组件记录日志消息。如何体现了职责链模式：每个记录器都跟踪“父”记录器，所谓”父”记录器，就是Logger命名空间中最近的现有祖先。
```java
public class Logger {
    public void log(LogRecord record) {
        if (!isLoggable(record.getLevel())) {
            return;
        }
        Filter theFilter = filter;
        if (theFilter != null && !theFilter.isLoggable(record)) {
            return;
        }

        // Post the LogRecord to all our Handlers, and then to
        // our parents' handlers, all the way up the tree.

        Logger logger = this;
        while (logger != null) {
            final Handler[] loggerHandlers = isSystemLogger
                ? logger.accessCheckedHandlers()
                : logger.getHandlers();
                        // 责任链模式
                        //每个日志记录都传递给分配给给定记录器的每个Handler，如果useParentHandlers是true，则将相同的算法一直应用于父级。
            for (Handler handler : loggerHandlers) {
                handler.publish(record);
            }

            final boolean useParentHdls = isSystemLogger
                ? logger.useParentHandlers
                : logger.getUseParentHandlers();

            if (!useParentHdls) {
                break;
            }

            logger = isSystemLogger ? logger.parent : logger.getParent();
        }
    }
}
```
在 javax.servlet.Filter#doFilter() 也有使用
### 3.2.Command

**命令模式**是一种行为设计模式， 它可将请求转换为一个包含与请求相关的所有信息的独立对象。 该转换让能根据不同的请求将方法参数化、 延迟请求执行或将其放入队列中， 且能实现可撤销操作。

#### Usage

1. 如果需要通过操作来参数化对象， 可使用命令模式。
2. 如果想要将操作放入队列中、 操作的执行或者远程执行操作， 可使用命令模式。
3. 如果想要实现操作回滚功能， 可使用命令模式。

#### Advantages

1. 单一职责原则。 可以解耦触发和执行操作的类。
2. 开闭原则。 可以在不修改已有客户端代码的情况下在程序中创建新的命令。
3.  可以实现撤销和恢复功能。
4. 可以实现操作的延迟执行。
5. 可以将一组简单命令组合成一个复杂命令。

#### Disadvantages
1. 代码可能会变得更加复杂， 因为在发送者和接收者之间增加了一个全新的层次。

#### Demo

Runnable担当命令的角色，Thread充当的是调用者，start方法就是其执行方法。

通过实现Runable接口的类，将请求封装为一个对象，对请求排队或记录请求日志，以及支持可撤销操作。允许接受请求的一方决定是否要否决请求，最重要一点就是：命令模式把请求一个操作的对象和怎么执行一个操作的对象解耦。这就是Excutor框架执行实现Runable接口任务类的体现。

```java
package java.lang;
/*
Thread pools（线程池） 通常一个典型的线程池实现类可能有一个名为addTask()的public方法，用来添加一项工作任务到任务 队列中。该任务队列中的所有任务可以用command对象来封装，通常这些command对象会实现一个通用的接口比如java.lang.Runnable。
*/
@FunctionalInterface
public interface Runnable {
    public abstract void run();
}
```

### 3.3.Iterator

**迭代器模式**是一种行为设计模式， 让能在不暴露集合底层表现形式 （列表、 栈和树等） 的情况下遍历集合中所有的元素。

#### Usage

1. 当集合背后为复杂的数据结构， 且希望对客户端隐藏其复杂性时 （出于使用便利性或安全性的考虑）， 可以使用迭代器模式。
2. 使用该模式可以减少程序中重复的遍历代码。
3. 如果希望代码能够遍历不同的甚至是无法预知的数据结构， 可以使用迭代器模式。

#### Advantages
1. 单一职责原则。 通过将体积庞大的遍历算法代码抽取为独立的类， 可对客户端代码和集合进行整理。
2. 开闭原则。 可实现新型的集合和迭代器并将其传递给现有代码， 无需修改现有代码。
3. 可以并行遍历同一集合， 因为每个迭代器对象都包含其自身的遍历状态。
4. 相似的， 可以暂停遍历并在需要时继续。

#### Disadvantages
1. 如果的程序只与简单的集合进行交互， 应用该模式可能会矫枉过正。
2. 对于某些特殊集合， 使用迭代器可能比直接遍历的效率低。

#### Demo

许多框架和程序库都会使用它来提供遍历其集合的标准方式。
```java
package java.util;
import java.util.function.Consumer;

public interface Iterator<E> {

    boolean hasNext();
    E next();
     default void remove() {
        throw new UnsupportedOperationException("remove");
    }
    default void forEachRemaining(Consumer<? super E> action) {
        Objects.requireNonNull(action);
        while (hasNext())
            action.accept(next());
    }
}
```

```java
package java.util;

public interface Enumeration<E> {

    boolean hasMoreElements();

    E nextElement();
}

```

### 3.4.Mediator

**中介者模式**是一种行为设计模式， 能让减少对象之间混乱无序的依赖关系。 该模式会限制对象之间的直接交互， 迫使它们通过一个中介者对象进行合作。

#### Usage

1. 当一些对象和其他对象紧密耦合以致难以对其进行修改时， 可使用中介者模式。
2. 当组件因过于依赖其他组件而无法在不同应用中复用时， 可使用中介者模式。
3. 如果为了能在不同情景下复用一些基本行为， 导致需要被迫创建大量组件子类时， 可使用中介者模式。

#### Advantages
1. 单一职责原则。 可以将多个组件间的交流抽取到同一位置， 使其更易于理解和维护。
2. 开闭原则。 无需修改实际组件就能增加新的中介者。
3. 可以减轻应用中多个组件间的耦合情况。
4. 可以更方便地复用各个组件。

#### Disadvantages
1. 一段时间后， 中介者可能会演化成为上帝对象。

#### Demo
MVC中的Controller就是中介者

```java
package java.util;
import java.util.Date;
import java.util.concurrent.atomic.AtomicInteger;


public class Timer {
    public void schedule(TimerTask task, long delay, long period) {
        if (delay < 0)
            throw new IllegalArgumentException("Negative delay.");
        if (period <= 0)
            throw new IllegalArgumentException("Non-positive period.");
        sched(task, System.currentTimeMillis()+delay, -period);
    }
        //以及其他schedule方法
}
```

以及JUC中的
```java
package java.util.concurrent;

public interface Executor {
    void execute(Runnable command);
}
```
与反射的invoke
```java
package java.lang.reflect;

import ...

public final class Method extends Executable {
    @CallerSensitive
    public Object invoke(Object obj, Object... args)
        throws IllegalAccessException, IllegalArgumentException,
           InvocationTargetException
    {
        if (!override) {
            if (!Reflection.quickCheckMemberAccess(clazz, modifiers)) {
                Class<?> caller = Reflection.getCallerClass();
                checkAccess(caller, clazz, obj, modifiers);
            }
        }
        MethodAccessor ma = methodAccessor;             // read volatile
        if (ma == null) {
            ma = acquireMethodAccessor();
        }
        return ma.invoke(obj, args);
    }
}
/*
package sun.reflect;

@Retention(RetentionPolicy.RUNTIME)
@Target({METHOD})
public @interface CallerSensitive {
}
*/
```

### 3.5.Snapshot

**备忘录模式**是一种行为设计模式， 允许在不暴露对象实现细节的情况下保存和恢复对象之前的状态。

#### Usage

1. 当需要创建对象状态快照来恢复其之前的状态时， 可以使用备忘录模式。
2. 当直接访问对象的成员变量、 获取器或设置器将导致封装被突破时， 可以使用该模式。


#### Advantages
1. 可以在不破坏对象封装情况的前提下创建对象状态快照。
2. 可以通过让负责人维护原发器状态历史记录来简化原发器代码。


#### Disadvantages
1. 如果客户端过于频繁地创建备忘录， 程序将消耗大量内存。
2. 负责人必须完整跟踪原发器的生命周期， 这样才能销毁弃用的备忘录。
3. 绝大部分动态编程语言 （例如 PHP、 Python 和 JavaScript） 不能确保备忘录中的状态不被修改。

#### Demo

```java
package java.io;
public interface Serializable {
}
```

### 3.6.Observer

**观察者模式**是一种行为设计模式， 允许定义一种订阅机制， 可在对象事件发生时通知多个 “观察” 该对象的其他对象。

#### Usage

1. 当一个对象状态的改变需要改变其他对象， 或实际对象是事先未知的或动态变化的时， 可使用观察者模式。

2. 当应用中的一些对象必须观察其他对象时， 可使用该模式。 但仅能在有限时间内或特定情况下使用。

#### Advantages
1. 开闭原则。 无需修改发布者代码就能引入新的订阅者类 （如果是发布者接口则可轻松引入发布者类）。
2. 可以在运行时建立对象之间的联系。

#### Disadvantages
1. 订阅者的通知顺序是随机的。

#### Demo

```java
package java.util;

public interface EventListener {
}

//广泛应用于Swing组件
```
在servlet中javax.servlet.http.HttpSessionBindingListener和javax.servlet.http.HttpSessionAttributeListener出现
```java
// 安卓开发中的button观察者注册
Button button = (Button) findViewById(R.id.button);
//注册观察者
button.setOnClickListener(new View.OnClickListener(){
    //观察者实现
        @Override
        public void onClick(View arg0) {
            Log.d("test", "Click button ");
        }
    });
```

### 3.7.State

**状态模式**是一种行为设计模式， 让能在一个对象的内部状态变化时改变其行为， 使其看上去就像改变了自身所
属的类一样。（有限状态机）

#### Usage
1. 如果对象需要根据自身当前状态进行不同行为， 同时状态的数量非常多且与状态相关的代码会频繁变更的话， 可使用状态模式。
2. 如果某个类需要根据成员变量的当前值改变自身行为， 从而需要使用大量的条件语句时， 可使用该模式。
3. 当相似状态和基于条件的状态机转换中存在许多重复代码时， 可使用状态模式。

#### Advantages
1. 单一职责原则。 将与特定状态相关的代码放在单独的类中。
2. 开闭原则。 无需修改已有状态类和上下文就能引入新状态。
3. 通过消除臃肿的状态机条件语句简化上下文代码。

#### Disadvantages
1. 如果状态机只有很少的几个状态， 或者很少发生改变， 那么应用该模式可能会显得小题大作。

#### Demo
```java
javax.faces.lifecycle.LifeCycle#execute()    
```

计算机网络中的rdt模型

包括[github.com/askervin/goresctrl](https://pkg.go.dev/github.com/askervin/goresctrl)

### 3.8.Strategy

**策略模式**是一种行为设计模式， 它能让定义一系列算法， 并将每种算法分别放入独立的类中， 以使算法的对象能够相互替换。

#### Usage

1. 当想使用对象中各种不同的算法变体， 并希望能在运行时切换算法时， 可使用策略模式。
2. 当有许多仅在执行某些行为时略有不同的相似类时， 可使用策略模式。
3. 如果算法在上下文的逻辑中不是特别重要， 使用该模式能将类的业务逻辑与其算法实现细节隔离开来。
4. 当类中使用了复杂条件运算符以在同一算法的不同变体中切换时， 可使用该模式。

#### Advantages
1. 可以在运行时切换对象内的算法。
2. 可以将算法的实现和使用算法的代码隔离开来。
3. 可以使用组合来代替继承。
4. 开闭原则。 无需对上下文进行修改就能够引入新的策略。

#### Disadvantages
1. 如果的算法极少发生改变， 那么没有任何理由引入新的类和接口。 使用该模式只会让程序过于复杂。
2. 客户端必须知晓策略间的不同——它需要选择合适的策略。
3. 许多现代编程语言支持函数类型功能， 允许在一组匿名函数中实现不同版本的算法。 这样， 使用这些函数的方式就和使用策略对象时完全相同， 无需借助额外的类和接口来保持代码简洁。

#### Demo
Lambda方法就是代替策略模式的简单实现
javax.servlet.http.HttpServlet：  service()方法， 还有所有接受 Http.Servlet.Request和 Http.Servlet.Response对象作为参数的 doXXX()方法。
以及javax.servlet.Filter#doFilter()

```java
@FunctionalInterface
public interface Comparator<T> {
    int compare(T o1, T o2);
}

public class Collections {
    public static <T> void sort(List<T> list, Comparator<? super T> c) {
        list.sort(c);
    }
}
```

### 3.9.Template Method

**模板方法模式**是一种行为设计模式， 它在超类中定义了一个算法的框架， 允许子类在不修改结构的情况下重写算法的特定步骤。

#### Usage

1. 当只希望客户端扩展某个特定算法步骤， 而不是整个算法或其结构时， 可使用模板方法模式。

2. 当多个类的算法除一些细微不同之外几乎完全一样时， 可使用该模式。 但其后果就是， 只要算法发生变化， 就可能需要修改所有的类。

#### Advantages

1. 可仅允许客户端重写一个大型算法中的特定部分， 使得算法其他部分修改对其所造成的影响减小。
2. 可将重复代码提取到一个超类中。

#### Disadvantages
1. 部分客户端可能会受到算法框架的限制。
2. 通过子类抑制默认步骤实现可能会导致违反里氏替换原则。
3. 模板方法中的步骤越多， 其维护工作就可能会越困难。

#### Demo
java.io.InputStream、 java.io.OutputStream、 java.io.Reader 和 java.io.Writer 的所有非抽象方法。
java.util.AbstractList、 java.util.AbstractSet 和 java.util.AbstractMap 的所有非抽象方法。

```java
public abstract class AbstractList<E> extends AbstractCollection<E> implements List<E> {
    public boolean add(E e) {
        add(size(), e);
        return true;
    }
    public boolean addAll(int index, Collection<? extends E> c) {
        rangeCheckForAdd(index);
        boolean modified = false;
        for (E e : c) {
            add(index++, e);
            modified = true;
        }
        return modified;
    }
    public int indexOf(Object o) {
        ListIterator<E> it = listIterator();
        if (o==null) {
            while (it.hasNext())
                if (it.next()==null)
                    return it.previousIndex();
        } else {
            while (it.hasNext())
                if (o.equals(it.next()))
                    return it.previousIndex();
        }
        return -1;
    }
    //  ...
}
```

### 3.10.Visitor

**访问者模式**是一种行为设计模式， 它能将算法与其所作用的对象隔离开来。

#### Usage

1. 如果需要对一个复杂对象结构 （例如对象树） 中的所有元素执行某些操作， 可使用访问者模式。
2. 可使用访问者模式来清理辅助行为的业务逻辑。
3. 当某个行为仅在类层次结构中的一些类中有意义， 而在其他类中没有意义时， 可使用该模式。

####  优点
1. 开闭原则。 可以引入在不同类对象上执行的新行为， 且无需对这些类做出修改。
2. 单一职责原则。 可将同一行为的不同版本移到同一个类中。
3. 访问者对象可以在与各种对象交互时收集一些有用的信息。 当想要遍历一些复杂的对象结构 （例如对象树）， 并在结构中的每个对象上应用访问者时， 这些信息可能会有所帮助。

#### Disadvantages
1. 每次在元素层次结构中添加或移除一个类时， 都要更新所有的访问者。
2. 在访问者同某个元素进行交互时， 它们可能没有访问元素私有成员变量和方法的必要权限。

#### Demo

```java
package java.nio.file;

import java.nio.file.attribute.BasicFileAttributes;
import java.io.IOException;


public interface FileVisitor<T> {

    FileVisitResult preVisitDirectory(T dir, BasicFileAttributes attrs)
        throws IOException;

    FileVisitResult visitFile(T file, BasicFileAttributes attrs)
        throws IOException;

    FileVisitResult visitFileFailed(T file, IOException exc)
        throws IOException;

    FileVisitResult postVisitDirectory(T dir, IOException exc)
        throws IOException;
}
```

### 3.11.Interpreter

解释器模式用于对于一些固定文法构建一个解释句子的解释器。

#### Usage

如果一种特定类型的问题发生的频率足够高，那么可能就值得将该问题的各个实例表述为一个简单语言中的句子。这样就可以构建一个解释器，该解释器通过解释这些句子来解决该问题。

#### Advantages

1. 可扩展性比较好，灵活。 

2. 增加了新的解释表达式的方式。 

3. 易于实现简单文法。

#### Disadvantages
1. 可利用场景比较少。
2. 对于复杂的文法比较难维护。 
3. 解释器模式会引起类膨胀。 

#### Demo
```java
public abstract class Format implements Serializable, Cloneable {
    public final String format (Object obj) {
        return format(obj, new StringBuffer(), new FieldPosition(0)).toString();
    }
}
```
