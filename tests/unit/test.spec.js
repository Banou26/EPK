import { test, assert } from '../../dist/test.js'
// const assert = require('assert')
// import { test } from '../../dist/test.js'
// const assert = _ => {}
test('desc1', _ => {
  // console.log('first')
  // assert(true === false)
  // console.log('kkk')
  assert([1, 2, 3].includes(4))
})

// test('desc2', async _ => {
//   // console.log('second')
//   // assert(false === false)
// })

// Array(10).fill().forEach((_,i) => {
//   test(`desc${i}`, async _ => {
//     // console.log('second')
//     // assert(false === false)
//   })
// })
