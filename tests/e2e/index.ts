import type { Page } from 'playwright'

const urls = ['https://google.com', 'https://example.com']

group
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
    'my group',
    ({ data }) => {

    }
  )

test('e2e test succeed', () => {})

test('from e2e, test fail', () => {
  throw new Error('thrown error message')
})

console.log('e2e test file log')
