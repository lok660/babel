const { reject } = require("core-js/fn/promise")

const hello = args => {
  console.log(...args)
}


hello(123)

const b = [1, 23, , 4, 54]
const c = Array.from(b)
console.log(b)