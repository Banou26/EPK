
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
const urls2 = ['https://en.wikipedia.org/wiki/Main_Page', 'https://developer.mozilla.org/en-US/']

describe('my describe pre', () => {
  test('my pre describe test', () => {})
  test('my pre describe test failed', () => {
    throw new Error('thrown error message')
  })
})

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
      test('described failed test', () => {
        throw new Error('thrown error message')
      })
    }
  )

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
  }, [urls2])
  (
    'my describe url 2',
    ({ data } = {}) => {
      console.log('location.href 2', location.href)
      test('described url 2 test ran in url', () => {
        if (!urls2.includes(location.href)) throw new Error(`location.href (${location.href}) value wasnt in ${urls2.join(', ')}`)
        // expect(data.url).eq(window.location.href)
      })
      test('described url 2 test', () => {})
      test('described failed test', () => {
        throw new Error('thrown error message')
      })
    }
  )

describe('my describe 3', () => {
  test('my 3rd describe test', () => {})
  test('my 3rd describe test failed', () => {
    throw new Error('thrown error message')
  })
})

test('e2e test succeed', () => {})

test('from e2e, test fail', () => {
  throw new Error('thrown error message')
})

// console.log('e2e test file log')

