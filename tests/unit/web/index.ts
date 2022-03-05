
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

const urls = ['https://google.com', 'https://example.com']

describe
  .use(async ({ getPage, run }, [urls]) => {
    Promise.all(
      urls.map(async url => {
        const page = await getPage()
        await page.goto(url)
        await run(page, { data: {  } })
      })
    )
  }, [urls])
  (
    'my describe',
    ({ data } = {}) => {
      console.log('location.href', location.href)
      test('described test', () => {})
      test('described failed test', () => {
        throw new Error('thrown error message')
      })
    }
  )

test('e2e test succeed', () => {})

test('from e2e, test fail', () => {
  throw new Error('thrown error message')
})

console.log('e2e test file log')

