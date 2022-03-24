
// describe('my describe', () => {
//   test('described test', () => {})
//   test('described failed test', () => {
//     throw new Error('thrown error message')
//   })
// })

// test('test succeed', () => {})

// test('from web page, test fail', () => {
//   throw new Error('thrown error message')
// })

// console.log('web page test file log')

const urls = ['https://www.google.com/', 'https://sourcemapped.dev/functional-ish-js-and-state']

describe
  .use(async ({ getPage, run, prepareContext }, [urls]) => {
    const results = await Promise.all(
      urls.map(async url => {
        const { page, tabId, backgroundPage } = await getPage()
        await page.goto(url)
        await prepareContext({ page, tabId, backgroundPage })
        return await run({ page, tabId, backgroundPage }, { data: { url } })
      })
    )
    const failedResults = results.filter(({ tests }) => tests.some(test => test.status !== 'success'))
    if (failedResults.length) return failedResults[0]
    return results[0]
  }, [urls])
  (
    'my describe',
    ({ data } = {}) => {
      console.log('location.href', location.href)
      test('described test ran in url', () => {
        if (!urls.includes(location.href)) throw new Error(`location.href (${location.href}) value wasnt in ${urls.join(', ')}`)
        // expect(data.url).eq(window.location.href)
      })
      test('described test', () => {})
      // test('described failed test', () => {
      //   throw new Error('thrown error message')
      // })
    }
  )

test('e2e test succeed', () => {})

test('from e2e, test fail', () => {
  throw new Error('thrown error message')
})

// console.log('e2e test file log')

