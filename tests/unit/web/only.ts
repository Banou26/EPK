
import { setup, teardown, group, test } from '../../../lib/lib'

group('group', () => {
  test('grouped test skipped by only', () => {
    console.log('shouldnt run')
    throw new Error('shouldnt run')
  })
  test.skip('skipped test skipped by only', () => {
    console.log('shouldnt run')
    throw new Error('shouldnt run')
  })
  test.only('my only test', () => {})
})

test('normal test skipped by only', () => {
  console.log('shouldnt run')
  throw new Error('shouldnt run')
})
