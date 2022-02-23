
test('from background script, background page url is correct', () => {
  assert.equal(chrome.extension.getURL('background-page.html'), location.href)
})

console.log('bg foooo')
