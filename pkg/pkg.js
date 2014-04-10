/**
 * 
 * 用于名称空间的构建、管理以及资源隔离
 * 
 * @author wangsu01@baidu.com
 * 
 */
;(function(global,rootName) {
    /**
     * 包结构的自管理方法.提供添加包空间的addSubPackage及添加取得方法的getter,setter方法 所有自管理方法
     * 均会在页面载入完成后被自动清理掉.
     */
    var NS = 'NAMESPACE';
    var interName = 'CloudaJS_Framework';
    
    // node环境检测
    if(typeof(GLOBAL) != 'undefined' && typeof(module) !='undefined' && module.exports){
        global = GLOBAL;
    }
    
    /**
     *  记录所有包结构的全名及对应的包对像
     */
    var tables = {};
    var old = false;
    
    /*
     *  internal function
     */
    
    /**  
     *  根据给定的全名创建一个名称空间.
     *  方法利用创建出空间对像的prototype做为所创建名称空间的公共资源池，
     *  直接除加于空间对像的资源被认为是private，
     *  最终seal时候，替换空间对像为该对像的prototype达到隐藏的private资源的目的.
     *  
     *  @param fullName {string} 当前命名空间的全名.
     *  @returns {Object}  
     */
    var createSpace = function(fullName){
        var space , _prot = {};
        
        if(Object.create){
            space = Object.create(_prot);
        }else{
            /*
             * 如果存在Object.create 则js实现版本为1.85以上. 
             * 如果不存在，则同时不存在getPrototypeOf等方法. 对于个别低版本浏览器同时不存在__proto__属性，如Opera 10.5等
             * 所以在这里需要补充一个可以获取到得prototype的方法，
             */
            function fn(){};
            fn.prototype = _prot;
            space = new fn();
            
            space.__getPrototypeof = function(){
                return _prot;
            };
        }
        
        
        /*
         * 添加私有成员、方法
         */
        
        space.__namespace = NS;     // 是否是一个命名空间
        space.__isSeal = false;     // 是否已经执行seal处理
        
        /**
         * 触发当前空间下对某个资源所设的所有陷阱
         * @param name {string} 资源名称
         */
        space.__runTraps = function(name){
            var list = tables[fullName].traps[name];
            if(list && list.length > 0){
                list.forEach(function(item){
                    item(space[name]);
                });
            }
        };
        
        /**
         * 同步注册一个资源
         * @param namej {string} 资源名称
         * @param resource {Any} 将注册到该名称空间上的资源
         * @param isPrivate {Boolean} 是否注册为私有
         * @returns {any} 返回注册的resource
         */
        space.__reg = function(name, resource, isPrivate){
            if(isPrivate){
                space[name] = resource;
            }else{
                _prot[name] = resource;
            }
            // 尝试触发trap队列
            space.__runTraps(name);
            
            return resource;
        };
        
        /**
         * 异步注册一个资源
         * @param namej {string} 资源名称
         * @param isPrivate {Boolean} 是否注册为私有
         * @returns {function callback(resource){}} 回调方法，resource将被注册到该名称空间下. 
         * 如果重复调用这个callback方法，则可反复覆盖修改资源.
         */
        space.__regAsync = function(name, isPrivate){
            // return callback fun...
            return function(resource){
                if(isPrivate){
                    space[name] = resource;
                }else{
                    _prot[name] = resource;
                }
                //  尝试触发trap队列
                space.__runTraps(name);
            };
        };
        
        /**
         * 获取一个已注册的资源.
         * @param name {string} 目标获取的资源名称.
         * @returns {any} 目标资源，如果没有返回undefined.
         */
        space.__load = function(name){
            return space[name];
        };
        
        /**
         * 异步获取一个资源.当这个资源被注册、修改时，将自动触发callback所指定的方法.
         * @param name {string} 目标获取的资源名称.;
         * @param callback {function} 回调方法,
         *         当调用之个方法时，如果目标资源已存在，则自动执行一次callback.
         *         如果获到一个未被注册的资源，创建一个trap，直到目标资源被注册时，自动调用一次;
         */
        space.__watch = function(name,callback){
            var traps;
            // 是否已有陷阱队列,没有则创建
            if(!(tables[fullName].traps[name])){
                // 此处使用array ，便于对一个资源，使用多个trap.
                traps = tables[fullName].traps[name] = [];
            }else{
                traps = tables[fullName].traps[name];
            }
            
            /*
             * FIXME:
             * 此处不检测是否callback被重复注册，
             * 目前情况下，如果重复注册callback会导到traps队列中存在多个相同callback，
             * 在资源改变时将导至callback可能被执行多次，是否FIX视最终使用情况反馈决定.
             */
            traps.push(callback);
            
            // 如果资源存在，则自动执行一次
            if(space[name] !== undefined){
                // 资源被注册时，自动执行一次当前注册的trap
                callback(space[name]);
            }
            
        };
        
        /**
         * 在当前空间下添加子空间
         * @param name {string} 子空间名称
         * @returns {Object} 子空间对像
         */
        space.addSubPackage = function(name){
            var sfn = fullName + "." + name;  //package full name
            if(tables[fullName].isSeal){
                throw 'package ["' + fullName + '"] has sealed.';
            }else if(!tables[sfn]){
                // 创建包空间
                _prot[name] = createSpace(sfn);
                /*
                 * 记录包结构
                 * {
                 *      package:包结构对像,
                 *      isSeal : 是否执行过清理方法
                 *      traps: 资源陷阱，用于存放资源获的回调
                 * }
                 */ 
                tables[sfn] = {'spaceObj':space[name],'isSeal':false,traps:{}};
                
                return _prot[name];
            }else{
                throw 'package ["' + sfn + '"] already exists';
            }
        };
        
        /**
         * 清理当前命名空间下的子空间
         */
        space.__clear = function(){
            var ns;
            
            // 清理过的内容，不再执行清
            if(tables[fullName].isSeal){
                return;
            }
            
            // 清理子空间
            for(var key in _prot){
                ns = _prot[key];
                if(ns.__namespace === NS){
                    ns.__clear();
                    if(Object.getPrototypeOf){
                        _prot[key] = Object.getPrototypeOf(ns);
                    }else{
                        _prot[key] = ns.__getPrototypeof();
                    }
                    /*
                     * 利用prototype的求值检索顺序，在完整的空间对像间建立引用，
                     * 保证在清理方法调用之前，已经对空间对像所做的引用仍然可以访问private资源。
                     */
                    space[key] = ns;
                }
            }
            
            // 标记清理完成
            tables[fullName].isSeal = true;
        };
        
        return space;
    };
    
    /**
     * 如果目标空间存在，则将当前包空间上的对像，copy到新的包对像上用作public
     */
    old = global[rootName];
    global[rootName] =  createSpace(interName);
    tables[interName] =  {'spaceObj':global[rootName],'isSeal':false,traps:{}};
    
    if(old){
        for(var key in old){
            global[rootName].__reg([key],old[key]);
        }
    }
    
    
    /**
     * 隐藏根命名空间下的私有成员.
     */
    global[rootName].clear = function(){
        global[rootName].__clear();
        
        global[rootName].seal = undefined;
        delete global[rootName].seal;
        
        global[rootName] = Object.getPrototypeOf(global[rootName]);
    };
    

    if(typeof module !='undefined' && module.exports){
        GLOBAL[rootName] = global[rootName];    // 在node端仍然绑定到全局空间一个名为rootName的对像
        module.exports = function(){
            return global[rootName];
        };
    }
    
})(this,'clouda');
