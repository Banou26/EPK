
test('background page url is correct', () => {
  assert.equal(chrome.extension.getURL('background-page.html'), location.href)
})

test('failed test name', () => {
  throw new Error('my error')
})
// test('fail', () => throw new Error('Test should fail'))

// test('promise succeed', () => Promise.resolve())
// test('promise fail', () => Promise.reject('Test should fail'))

// test('async succeed', async () => {})
// test('async fail', async () => throw new Error('Test should fail'))

// test.serial('serial succeed', () => {})
// test.serial('serial fail', () => throw new Error('Test should fail'))

// test.serial('serial promise succeed', () => Promise.resolve())
// test.serial('serial promise fail', () => Promise.reject('Test should fail'))

// test.serial('serial async succeed', async () => {})
// test.serial('serial async fail', async () => throw new Error('Test should fail'))

// test.isolate('isolate succeed', () => {})
// test.isolate('isolate fail', () => throw new Error('Test should fail'))

// test.isolate('isolate promise succeed', () => Promise.resolve())
// test.isolate('isolate promise fail', () => Promise.reject('Test should fail'))

// test.isolate('isolate async succeed', async () => {})
// test.isolate('isolate async fail', async () => throw new Error('Test should fail'))
console.log('foooo')