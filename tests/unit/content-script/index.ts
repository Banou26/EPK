
test('from content script, background page url is correct', () => {
  assert.equal(chrome.extension.getURL('_generated_background_page.html'), location.href)
})

console.log('content-script foooo')
