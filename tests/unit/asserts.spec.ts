import { test, assert } from '../../src/assert/index.ts'

test('desc1', _ => {
  console.log('first')
  assert(true === true)
})

test('desc2', async _ => {
  console.log('second')
  assert(false === false)
})