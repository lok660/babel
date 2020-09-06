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

  

  babylon将源码转换为抽象语法树（AST）；babel-traverse通过AST生成一个便于操作、转换的path对象，供我们的babel插件处理；babel-generator读取AST并将其转换为代码和源码映射。这些过程不是本文的关注点，我们关注的是结果，哪些插件与我们的生产息息相关，我们如何去使用babel的插件

  

### babel包

### presets配置项

##### babel-core

可以看做 babel 的编译器，babel 的核心 api 都在这里面，比如 transform，主要都是处理转码。它会把 js 代码抽象成 ast，即源代码的抽象语法结构的树状表现形式。 es6 的新语法，先转成 ast，去发现这个语法的 kind，分别做对应的处理转化成 es5

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

```json
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
    "useBuiltIns": false
  }]
}
// webpack.base.conf.js
module.exports = {
  entry: ["@babel/polyfill", "./main.js"],
};
```



##### babel-preset-env

根据运行环境，自动确定你需要的 pulgins 和 polyfills，

```json
"presets": [
  [
    "env",
    {
      "modules": false, //设置ES6 模块转译的模块格式 默认是 commonjs
      "debug": true, // 开启debug后，编译结果会得到使用的 targets，plugins，polyfill 等信息
      "useBuiltIns": false, //是否开启自动支持 polyfill
      "include": [], // 总是启用哪些 plugins
      "exclude": [], //强制不启用哪些 plugins，用来防止某些插件被启用
      "targets": [
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

- @babel/polyfill 把原生的方法重写了，以promise为例，判断环境promise存不存在，不存在就写个全局作用域的promise。它会一次引入所有的api的polyfill，只是根据env配置引入的包大小可能会不同。
- @babel/runtime 是写了个helper函数，以promise为例，你代码中的promise都会被换成_promise，然后babel会生成一个_promise helper函数，大致也是目标环境存在就用原生的，不存在就用polyfill的promise。而且这个是按需引入的，如果你的项目中只使用了promise，就只会引入promise的polyfill。但是它有个问题，实例上的方法无能为力，比如 Array上的form方法，String上的includes等

根据它们两的特点，@babel/polyfil一般用于前端项目，@babel/runtime一般用来写插件





##### vue脚手架生成的项目,js如何兼容到IE9

```json
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