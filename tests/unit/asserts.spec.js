import { test, assert } from '../../dist/test.js'
// const assert = require('assert')
// import { test } from '../../dist/test.js'
// const assert = _ => {}

// throw new Error('LOL')

test('desc1', _ => {
  // console.log('first')
  // assert(true === false)
  console.log(`EPK now support logs`)
  console.info(`And info logs`)
  console.warn(`Also warns logs`)
  console.error(`With errors logs`)
  assert([1, 2, 3].includes(4))
})

test('desc2', async _ => {
  // console.log('second')
  assert(true === false)
})

test('desc3', async _ => {
  // console.log('second')
  assert(a === true)
})

test('desc4', async _ => {
  // console.log('second')
  assert(true === true)
})

// Array(10)
//   .fill()
//   .forEach((_, i) =>
//     test(`desc${i + 3}`, _ => {}))
