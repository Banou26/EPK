
describe('my describe', () => {
  test('described test', () => {})
})

test('test succeed', () => {})

test('from web page, test fail', () => {
  throw new Error('thrown error message')
})

console.log('web page test file log')
