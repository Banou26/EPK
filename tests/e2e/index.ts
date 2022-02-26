// import type { Page } from 'playwright'

// const urls = ['https://google.com', 'https://example.com']

// describe
//   .with(async ({ page, run }: { page: Page}, [urls]) => {
//     for (const url of urls) {
//       await page.goto(url)
//       await run({ data: { } })
//     }
//   }, [urls])
//   (
//     'my describe',
//     ({ data }) => {

//     }
//   )

test('test succeed', () => {})

test('from web page, test fail', () => {
  throw new Error('thrown error message')
})

console.log('web page test file log')
