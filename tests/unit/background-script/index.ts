
test('from background script, background page url is correct', () => {
  assert.equal(chrome.extension.getURL('_generated_background_page.html'), location.href)
})

test('from background script, test fail', () => {
  throw new Error('thrown error message')
})

console.log('background-script test file log')
