import { test, assert } from '../../src/test/index'
// const assert = require('assert')
// import { test } from '../../dist/test.js'
// const assert = _ => {}

// throw new Error('LOL')

test('desc1', _ => {
  // console.log('first')
  // assert(true === false)
  // console.log('kkk')
  assert([1, 2, 3].includes(4))
})

test('desc2', async _ => {
  // console.log('second')
  assert(true === false)
})

test('desc3', async _ => {
  // console.log('second')
  assert(true === true)
})

// Array(10)
//   .fill()
//   .forEach((_, i) =>
//     test(`desc${i + 3}`, _ => {}))
