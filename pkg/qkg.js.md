#pkg.js

>一个资源的管理工具，用于解决任何js项目中的 “第一个” 通用问题，即名称空间的问题。这段代码工具可以通用于nodejs或浏览器端等任意纯Javascript执行环境中。

## 关于存在
在一般Javascript项目的开发过程中，命名空间或包结构都是首先需要解决的内容，pkg.js就是这样一个经过整理的、用于提供包结构管理的工具类。除了一般包结构的功能外，还提供变化资源的加载控制和事件通知，用于处理异步载入的资源并提供一种互众不同的解决资源间的启动顺序问题的方案。在这两大基础功能之外，还可以提供一种相同包结果构的内部资源的隔离控制，主要用于解决一些内部方法的访问权限问题。

##使用方法
pkg.js是以一个独立的js文件的方式存在的，并且所有功能在一个匿名的闭包空间内，这样除了可以保证pkg.js的独立性以外还可以做到绝对不对你的已有代码产生任何影响。但是由此产生的问题就是你必须在修改这个文件中的一处地方来让pkg.js提供你所需的根命称空间。在获得pkg.js后，可以打开这个文件，并修改最后面调用闭包处的匿名字符串'clouda'为你所需要的任意名称. 这样在引用这个文件时，pkg.js将在全局的上下文中，创建一个这个名称同名的包空间对像，下文中，我仍然使用clouda做为根空间的名称. 即我的全局空间中，始终存在一个名字叫 clouda 的对像。

### 添加和移除资源
最简单的使用方法与所有的对像访问一样，你可以直接在这个空间下增加指定名称的资源，如：

	clouda.a = 100;

这样你便有在clouda的空间下有了一个名字叫a的资源，它的值是100, **但是我仍然推荐你使用一个名为 \_\_reg的方法来添加资源**，理由我会在下文中说明,如：

	clouda.__reg('a',100);

这样的结果与上面表面上看是一样的，它不会对你的代码产生任何影响。但是你所获得的将是一种资源的变化通知机制，你可以通过下面的方法监测到资源的变化。

	clouda.__watch("a",function(value){
		//dosomething...
	});

每次你使用 __reg 来改变a的值时，上面的function将会被执行，并将最新的值传给value。由此你便可以获得最新的资源值， 在另外一些情况，你不希望别人知道实际改变的资源名称和位置，所以这里还提供一种异步的资源变更机制，如：

	var fun = clouda.__regAsync("a");
	// dosomething after
	fun(100);

在执行__regAsync方法，将获得一个可执行函数，这个函数的做用，就是在执行时设置 'a' 的值. 由此你便可以将这个函数传递或保存到任何你想到的地方，即便是在资源被隔离时仍然有效，关于***资源的隔离***，我将在更下面的内容里说明。 

### 使用子空间

在大部份时候，只有一层的包空间并不能满足我们的需求，所以这里还有一个addSubPackage方法，用来增加子命名空间。

	var subpkg = clouda.addSubPackage("net");
	subpkg.__reg("a",200);
	var setBValue = clouda.net.__regAsync("b");
	// dosomething after
	setBValue("the value 'b' is a string");
	
	console.log(clouda.net.a,clouda.net.b);		// output:  200 , the value 'b' is a string

方法addSubPackage将增加一个名称为net的pkg对像到clouda下并返回这个新增加的对像。 这个对像的行为与clouda对像是一样的.

### 资源隔离

在一些情况下，例如在我开发框架的过程中，我们并不希望一个名称空间下的所有资源都能被外部的开发者访问到，但是又希望在自己的框架内部可以正常被访问。同时又不希望用更复杂的资源访问方法(如使用更复杂的getter方法等)，为了解决这种情况，我提供以下的解决方案，它未必是最完美的解决方案，但这是我现在所能想到最管用的，**对于不熟悉Javascript的prototype机制和对像的传值引用机制的人对于此部份可能理解上会有些困难，所以建议可以先了解一下这两个方面的知识**，或者如果你不是太关注资源隔离问题可以忽略这一部份，只使用上面的内容同样了可以出色的完成对名称空间与资源的管理。

如果你看到这部份，那么我认为你已经了解了javascript的prototype机制与传值引用机制，在这里首先介绍一下资源隔离的实现原理。
在这个实现过程中，我认为放在对像的 prototype部份的资源，是公共资源(public),放在对像本身上的资源被认为是受保护的(protected)，如此我便能根据需要将资源分别放在两个位置上.即在所有的添加动作过程中，如 \_\_reg, \_\_regAsync , \_\_addSubPackage这几个方法中提供了最后一个参数，这个参数是一个boolean值，在值为true时，所添加的资源将被放在包对像的自身上，其它情况下将放在包对像的prototype上。在执行的过程中，将分为两个部份，分别是框架自身的启动过程与框架外内容的启动过程，在自身启动过程的最后，通过根对像上的 clear方法切换引用的链路，将全局空间下的根对像及其下的所有引用直接关联到对像的prototype上，并将子空间对像的连接也同样直接连接至子空间对像的prototype上，由此改变求值链上的求值过程，使其跳过包对像自身上附加的属性，实现隐藏受保护的资源的目的.并保证在框架自身的启动过程中已持有包空间对像自身的引用仍然正常访问公共资源和受保护的资源.

具体用法如下：
	
	
	// 设置一个受保护的a ＝ 100;
	clouda.__reg("a",100,true);
	
	// 如果启用资源隔离，则需要注意，这种用法附加的资源，将认为是受保护的资源
	clouda.b = 200;
	
	//添加一个监视器
	clouda.__watch("c",function(c){
	    console.log("new c is  %s" , c);
	});
	
	var setC = null;
	
	(function(){
	    // 用一个闭包来模拟框架自身的启动过程。
	    var root = clouda;
	
	    clouda.__reg('getA',function(){
	        // !!Import , use the 'clouda';
	        return clouda.a;
	    });;
	    
	    clouda.__reg('getB',function(){
	        // !!Import , there useing the 'root' , not that 'clouda';
	        return root.b;            
	    });
	    
		/*
		 * 向外提供一个setter，用于在隔离资源后，也能改变C的内容. 
		 * 这里将c注册为受保护的内容.但是并不影响setter方法的执行
		 */ 
	    setC = clouda.__regAsync('c',true);
	
	    console.log(root.getA());     //output : 100
	    
	    setC('cccc');
	    
	    
	    debugger;
	    root.clear();
	})();
	
	console.log(clouda.getA());     //output : undefined;
	console.log(clouda.b);          //output : undefined;
	console.log(clouda.getB());     //output : 200;
	console.log(clouda.__watch);    //output : undefined;
	console.log(clouda.c);    		//output : undefined;
	setC("new ccc");                //output again: "new c is  %s" , c

这里仍然要再次强调一下，**在启用资源隔离后， 不通过 \_\_reg 方法而直接附加的资源，将被认为是受保护的资源**  

##API Guide

### pkg.js::Constructor
这个构造方法是指pkg.js中的匿名构方法，你需要在pkg.js的最下面改变根名称空间的名称为你需要的名称，在下面我仍然保持默认名称为 'clouda'.

### clouda.addSubPackage(name,[isPrivate]);
添加一个子名称空间. .name 是一个字符串值，表示将要添加的子名称空间的名称， isPrivate是一个可选值，默认为false，如果指定为true，表示添加的子空间将受到访问限制的保护，将不能被外部访问到 

### clouda.__reg(name,value,[isPivate]);
向当前名称空间添加一个资源.name 是一个字符串值，表示将要添加的资源名称, value 可以是任意内容，isPrivate是一个可选值，默认为false，如果指定为true，表示添加的资源将受到访问限制的保护，将不能被外部访问到。

### clouda.__regAsync(name,[isPivate]);
异步注册一个资源，方法返回一个可执行的setter方法，每次调用时，将会覆盖前一次设置的值,.name 是一个字符串值，表示将要添加的资源名称, isPrivate是一个可选值，默认为false，如果指定为true，表示添加的资源将受到访问限制的保护，将不能被外部访问到。

### clouda.__load(name);
通过name载入一个资源. 如果没有则返回undefined. 

### clouda.__watch(name,callback);
注册一个监视器，用来监测name所指定的资源的变化，每次资源变化时，将触发callback，并将最新的资源传入callback的第一个参数.

### clouda.clear();
启用资源隔离，在框架自身代码初始化完成后，调用该方法后，后续的代码将不能访问所有受保护的资源，同时也将无法访问名称空间对像上的所有方法。在框架中已持有完全的名称空间引用对像的代码不受影响，仍然可以直接访问所有资源。



