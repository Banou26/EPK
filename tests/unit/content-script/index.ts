
test('from content script, background page url is correct', () => {
  assert.equal(chrome.extension.getURL('background-page.html'), location.href)
})

console.log('content-script foooo')
