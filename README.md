### babel的主要使用场景

- ES6的代码转换为ES5代码，使得开发兼容到生产

- ES6最新的api没有普遍提供实现，借助core-js自动给js代码添加polyfill，以便最终生产环境的代码能够正常使用新的api；babel始终能提供对最新es提案的支持

- 规范代码风格，提高代码质量，借助babel，将源码做标准化转换处理，提升开发质量

- .vue文件与jsx，正确地转换为ES代码

- 借助强类型语言静态分析能力，对js代码做一些检查，将flow和typescript的代码，转换为标准的ES代码

- 生成代码的sourcemap，便于排查特殊问题

- es6编写的modules在被require的时候，自动进行代码转换

  

### babel编译过程

- parser(解析)：通过[babylon](https://github.com/babel/babylon)解析成 AST

- transform(转换)：进一步的做语法等自定义的转译，仍然是 AST

- generator(生成)：最后通过 babel-generator 生成 output string

  

  ![img](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9150bccc88ab45e48ab55af3089e2c1a~tplv-k3u1fbpfcp-zoom-1.image?imageslim)

  

  babylon将源码转换为抽象语法树（AST）；babel-traverse通过AST生成一个便于操作、转换的path对象，供我们的babel插件处理；babel-generator读取AST并将其转换为代码和源码映射。这些过程不是本文的关注点，我们关注的是结果，哪些插件与我们的生产息息相关，我们如何去使用babel的插件

  

### babel包

###  Plugin/Preset 排序

1. `Plugin`会运行在`Preset`之前;

2. `Plugin`会从第一个开始顺序执行;

   ```js
   {
     "plugins": [
       "transform-decorators-legacy",
       "transform-class-properties"
     ]
   }
   // 将先执行 transform-decorators-legacy,再执行 transform-class-properties
   ```

   

3. `Preset`的顺序则刚好相反(从最后一个逆序执行)。

   ```js
   // 一定要记得 preset 的顺序是反向的。举个例子:
   
   {
     "presets": [
       "es2015",
       "react",
       "stage-0"
     ]
   }
   // 按以下顺序运行: stage-0，react，最后es2015
   ```

   

### presets配置项

##### babel-core

可以看做 babel 的编译器，babel 的核心 api 都在这里面，比如 transform，主要都是处理转码。它会把 js 代码抽象成 ast，即源代码的抽象语法结构的树状表现形式。 es6 的新语法，先转成 ast，去发现这个语法的 kind，分别做对应的处理转化成 es5

```js
@babel/core包含的是整个babel工作流，在开发插件的过程中，如果每个API都单独去引入岂不是蒙蔽了来吧～于是就有了@babel/core插件，顾名思义就是核心插件，他将底层的插件进行封装（包含了parser、generator等），提高原有的插件开发效率，简化过程，好一个“🍟肯德基全家桶”
```



##### babel-polyfill

Babel默认只转换新的JavaScript句法（syntax），不转码的API非常多，比如Iterator、Generator、Set、Maps、Proxy、Reflect、Symbol、Promise等。为当前环境提供一个垫片，以类似 Array.prototype.includes() 的方式去注入污染原型，最适合应用级开发的 polyfill，开发库的话，不推荐使用，在7.x之前缺点也显而易见，那就是占文件空间并且无法按需定制

使用方法:

```shell
npm i @babel/polyfill -S
```

```js
//	使用方式二者选其一

//	vue main.js
import "@babel/polyfill"

//	webpack.config.js
module.exports = {
    entry:["@babel/polyfill","main.js"]
}
```

上面这两种方式是将整个polyfill都引入了，很多代码其实对我们是没有用的，比如，我们的env配置的是不需要兼容ie9以下的浏览器，这种引入方式把所有兼容ie的代码都引入了，包含ie8以下，所以，一般我们会在`.babelrc`文件里的env里配置下`useBuiltIns`参数，这样babel在引入的时候会根据我们env环境去加载相应的polyfill

如以下两种方式

- 如果在 .babelrc 中设置 useBuiltIns: 'usage'，则不要在 webpack.config.js entry 数组或 源码中包含 @babel/polyfill。注意，仍然需要安装 babel-polyfill（就是说 npm i -S @babel/polyfill后就不管了）。
- 如果在 .babelrc 中设置 useBuiltIns: 'entry'，在应用程序入口（main.js）的顶部引入 @babel/polyfill。
- 如果在 .babelrc 中没有明确设置useBuiltIns的值（就是你没有去配置这项）或者设置了 useBuiltIns: false，将 @babel/polyfill 添加到 webpack.config.js 的入口数组中。

```js
// .babelrc
{
  ["env", {
    "modules": false,
    "targets": {
      "browsers": ["> 1%", "last 2 versions", "not ie <= 8"]
    },
    // 是否自动引入polyfill，开启此选项必须保证已经安装了babel-polyfill
    // 在这里设置自动引入后，babel会根据你配置的兼容的环境，去按需加载polyfill的代码，这样能保证代码量最少
    // 参数：Boolean，默认为false.
    "useBuiltIns": "usage"
  }]
}
// webpack.base.conf.js
module.exports = {
  entry: ["@babel/polyfill", "./main.js"],
};
```



##### babel-preset-env

根据运行环境，自动确定你需要的 pulgins 和 polyfills，

```js
"presets": [
  [
    "env",
    {
      "modules": false, //设置ES6 模块转译的模块格式 默认是 commonjs
      "debug": true, // 开启debug后，编译结果会得到使用的 targets，plugins，polyfill 等信息
      "useBuiltIns": false, //是否开启自动支持 polyfill
        /*
         entry: 去掉目标浏览器已支持的polyfilll 模块，将浏览器不支持的都引入对应的polyfilll 模块。

		usage: 打包时会自动根据实际代码的使用情况，结合 targets 引入代码里实际用到部分 polyfilll模块

		false: 不会自动引入 polyfilll 模块，对polyfilll模块屏蔽
        */
      "include": [], // 总是启用哪些 plugins
      "exclude": [], //强制不启用哪些 plugins，用来防止某些插件被启用
      "targets": [	//	配支持的环境
        "browers": ["last 2 versions", "not ie <= 9"]	//	就是告诉babel你的js要兼容哪些环境，它会帮你将你写的js转译成目标环境兼容的js语法
      ]
    }
  ]
]
```

```js
//	通过env转换的几个demo

a => a

// 转为
function (a) {return a}

function func (b = false) {return false}
// 转为
function func (b) {
  b = b || false
  return b
}
//	比较明显，上面的都属于转换语法，所以应该说“js无论用什么新语法，@babel/preset-env都能帮你兼容到目标环境”。
```



### plugin配置项

##### babel-plugin-transform-runtime

`transform-runtime`核心就是为了对`helpers`进行自动提取和其它优化，所谓优化其中一点就是防止重复引用。对比使完全引入用`babel-polyfill`打包后的体积减少很多，而且不会污染原生的对象，适合开发类库

```js
//	npm i -D @babel/plugin-transform-runtime

// .babelrc
{
  "plugins": [
    "@babel/plugin-transform-runtime",
    // 默认配置
      {
        "absoluteRuntime": false,
        "corejs": false,
        "helpers": true,
        "regenerator": true,
        "useESModules": false
      }
  ]
}
```

```js
class Person{}

//在没有使用transform-runtime时，每个使用class函数处，Babel 会生成class的helper函数放置在文件顶部，就是说在多个文件里使用了class, babel就会在每个文件里面都生成相同的helper

"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function"); } }

var Person = function Person() {
  _classCallCheck(this, Person);
};
```

```js
//	这样不必要的重复会使我们的代码体积非常雍肿，transform-runtime就是来解决这个重复生成helper的问题的，它会将这个es6的class语法的helper函数放在babel-runtime/helpers里，然后在使用处通过require引入，这样就没必要在每个使用处重复定义helper了，达到了减少代码体积的效果

"use strict";

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Person = function Person() {
  (0, _classCallCheck3.default)(this, Person);
};
```



### 总结

##### @babel/runtime 对比 babel-polyfill

@babel/runtime和@babel/polyfill这两个模块功能几乎相同，就是转码新增 api

- babel-polyfill 是当前环境注入这些 es6+ 标准的垫片，好处是引用一次，不再担心兼容，而且它就是全局下的包，代码的任何地方都可以使用。缺点也很明显，它会污染原生的一些方法，polyfill 把原生的方法重写了，如果当前项目已经有一个 polyfill 的包了，那你只能保留其一。而且一次性引入这么一个包，会大大增加体积。如果你只是用几个特性，就没必要了，如果你是开发较大的应用，而且会频繁使用新特性并考虑兼容，那就直接引入吧。
- transform-runtime 是利用 plugin 自动识别并替换代码中的新特性，你不需要再引入，只需要装好 babel-runtime 和 配好 plugin 就可以了。好处是按需替换，检测到你需要哪个，就引入哪个 polyfill，如果只用了一部分，打包完的文件体积对比 babel-polyfill 会小很多。而且 transform-runtime 不会污染原生的对象，方法，也不会对其他 polyfill 产生影响。所以 transform-runtime 的方式更适合开发工具包，库，一方面是体积够小，另一方面是用户（开发者）不会因为引用了我们的工具，包而污染了全局的原生方法，产生副作用，还是应该留给用户自己去选择。缺点是随着应用的增大，相同的 polyfill 每个模块都要做重复的工作（检测，替换），虽然 polyfill 只是引用，编译效率不够高效。**另外，instance 上新添加的一些方法，babel-plugin-transform-runtime 是没有做处理的，比如 数组的 `includes, filter, fill` 等，这个算是一个关键问题吧，直接推荐用 polyfill。**
- 

根据它们两的特点，@babel/polyfil一般用于前端项目，@babel/runtime一般用来写插件



> **两种方式的原理：**

- **babel-polyfill：** 不会将代码编译成低版本的`ECMAScript`，其原理是：当运行环境中并没有实现的一些方法，`babel-polyfill`中会给做兼容。
- **babel-runtime：** 将`es6`编译成`es5`去运行，前端可以使用`es6`的语法来写，最终浏览器上运行的是`es5`。

> **两种方式的优缺点：**

- **babel-polyfill：** 通过向全局对象和内置对象的`prototype`上添加方法来实现，比如运行环境中不支持`Array-prototype.find`，引入`polyfill`，前端就可以放心的在代码里用es6的语法来写；但是这样会造成全局空间污染。比如像`Array-prototype.find`就不存在了，还会引起版本之前的冲突。不过即便是引入`babel-polyfill`，也不能全用，代码量比较大。
- **babel-runtime：** 不会污染全局对象和内置的对象原型。比如当前运行环境不支持promise，可以通过引入`babel-runtime/core-js/promise`来获取promise，或者通过`babel-plugin-transform-runtime`自动重写你的promise。**但是它不会模拟内置对象原型上的方法**，比如Array-prototype.find，就没法支持了，如果运行环境不支持es6，代码里又使用了find方法，就会出错，因为es5并没有这个方法。

> **babel-polyfill 与 babel-runtime 的最大区别在于：babel-polyfill改造目标浏览器，让你的浏览器拥有本来不支持的特性；babel-runtime改造你的代码，让你的代码能在所有目标浏览器上运行，但不改造浏览器。**



##### vue脚手架生成的项目,js如何兼容到IE9

```js
// .babelrc
{
    "presets": [
      ["env", {
        // 这里默认是false，不用再写一遍
-        // "modules": false,
        // 一般不单独写出来，babel/preset-env会自个读取package里面的browserslist，与css兼容环境保持一致
        // https://github.com/browserslist/browserslist
-      //  "targets": {
-        //  "browsers": ["> 1%", "last 2 versions", "not ie <= 8"]
-      //  },
      }],
      "stage-2"
    ],
    "plugins": ["transform-vue-jsx", "transform-runtime"]
  }

// webpack.base.conf.js
module.exports = {
  entry: ["@babel/polyfill", "./main.js"],
};
```





| 作用                                                         | 名称                           | 备注                                                        |
| ------------------------------------------------------------ | ------------------------------ | ----------------------------------------------------------- |
| 允许命令行使用 babel 命令转译文件                            | babel/cli                      | 一般在写插件时使用                                          |
| 为所有 API 增加兼容方法                                      | babel/polyfill                 | 需要在所有代码之前 require，且体积比较大                    |
| 把帮助类方法从每次使用前定义改为统一 require，精简代码       | babel/plugin-transform-runtime | ---                                                         |
| helper库                                                     | babel/runtime                  | 需要安装为依赖，而不是开发依赖，node环境使用，web环境不需要 |
| babel插件在webpack项目中的一个入口                           | babel/loader                   | ---                                                         |
| babel的polyfill库                                            | babel/core                     | ---                                                         |
| babel预制环境的集合插件，通过配置目标环境，转换标准上的新特性 | babel/preset-env               | 只转新特性，不转api                                         |
| 转换草案stage-2以及stage-3阶段的的新属性                     | babel/preset-stage-2           | ---                                                         |





[掘金树酱]: https://juejin.im/post/6863705400773083149?utm_source=gold_browser_extension#heading-1
[babel中文网]: https://www.babeljs.cn/docs/

