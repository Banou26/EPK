
test('from background script, background page url is correct', () => {
  assert.equal(chrome.extension.getURL('_generated_background_page.html'), location.href)
})

console.log('bg foooo')
