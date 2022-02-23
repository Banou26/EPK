
test('from content script, background page url is correct', () => {
  assert.equal(chrome.extension.getURL('_generated_background_page.html'), `chrome-extension://${chrome.runtime.id}/_generated_background_page.html`)
})

test('from content script, test fail', () => {
  throw new Error('thrown error message')
})

console.log('content-script test file log')
