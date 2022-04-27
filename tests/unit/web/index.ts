import { expect } from 'chai'
import { setup, teardown, group, test, runInUrls, withData } from '../../../lib/lib'

// group('my group', () => {
//   test('group test', () => {})
//   test('group failed test', () => {
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

group('my group pre', () => {
  setup(() => {
    console.log('setup')
    return () => {
      console.log('setup teardown')
    }
  })
  teardown(() => {
    console.log('teardown')
  })
  test('my pre group test', () => {
    console.log('normal test run')
  })
  test.skip('my pre group test skipped', () => {
    console.log('skipped test run')
    throw new Error('thrown error message')
  })
  test('my pre group test 2', () => {
    console.log('test run')
    throw new Error('thrown error message')
  })
})

test('test has access to extensions', ({ extensions }) => {
  console.log('EXTENSIONS', JSON.stringify(extensions))
})

test('e2e test succeed', () => {})

test('from e2e, test fail', () => {
  throw new Error('thrown error message')
})

// group
//   .use(withData, [{ data: 'foo' }])
//   (
//     'my group data',
//     ({ data }) => {
//       test('group test ran with data', () => {
//         expect(data).to.equal('foo')
//       })
//     }
//   )

group
  .use(runInUrls, [urls])
  (
    'my group',
    () => {
      console.log('location.href', location.href)
      test('group test ran in url', () => {
        if (!urls.includes(location.href)) throw new Error(`location.href (${location.href}) value wasnt in ${urls.join(', ')}`)
        // expect(data.url).eq(window.location.href)
      })
      test('group test', () => {})
      test('group failed test', () => {
        throw new Error('thrown error message')
      })
    }
  )

// group
//   .use(runInUrls, [urls2])
//   (
//     'my group url 2',
//     () => {
//       console.log('location.href 2', location.href)
//       test('group url 2 test ran in url', () => {
//         if (!urls2.includes(location.href)) throw new Error(`location.href (${location.href}) value wasnt in ${urls2.join(', ')}`)
//         // expect(data.url).eq(window.location.href)
//       })
//       test('group url 2 test', () => {})
//       test('group failed test', () => {
//         throw new Error('thrown error message')
//       })
//     }
//   )

// group('my group 3', () => {
//   test('my 3rd group test', () => {})
//   test('my 3rd group test failed', () => {
//     throw new Error('thrown error message')
//   })
// })

// test('e2e test succeed', () => {})

// test('from e2e, test fail', () => {
//   throw new Error('thrown error message')
// })

// console.log('e2e test file log')

