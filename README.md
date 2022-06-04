# EPK

## Introduction
EPK serves as a all-in-one tool for testing javascript, It will be able to have a test runner on both Node and Web environments.

In addition of that, for the node runner, EPK plans on supporting all major web browsers (Chrome, Firefox, Safari, Edge, ect...) for tests to run in, in addition of running tests in node.

One of the main goals for this project is to support testing [Web Extensions](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions), as there is a big void in the testing tools out there regarding them.

You should be able to write tests that will run in all contexts needed for real applications.
That means you'll be able to run tests in actual web pages, in web pages's content script contexts, and in extension background pages. So you'll be able to run tests in more real environments without having to mock APIs.

## features
- Currently supported test runner environment:
  - [x] NodeJS
  - [ ] Web
- Testing environment supported:
  - [x] Chromium
  - [ ] Node
  - [ ] Firefox
  - [ ] Edge
  - [ ] Safari
- Run tests in environments
  - [x] web pages
  - [x] content script contexts
  - [x] background page contexts
  - [ ] node contexts
- Sideload web extensions in the test for web environments

## Startup guide

First thing to do is install EPK using `npm i epk -D`

The next step is to setup a `test.config.ts` file where we'll define all the test configurations

Here's a minimalistic test configuration

`test.config.ts`
```ts
import type { EPKConfig } from 'epk'

const config: EPKConfig = {
  configs: [
    {
      name: 'my config name',
      platform: 'chromium',
      browserConfig: {
        headless: false // This is a requirement if you want to run with web extensions
      },
      web: {
        match: ['./tests/**/*.ts']
      }
    }
  ]
}

export default config
```

As you can see, we've set the headless option to false, don't worry if you need EPK to run in CI environments, you can use on Linux, you can use `xvfb-run --auto-servernum -- npx epk` to run the test runner in a virtual framebuffer.

Now we'll setup a few simple tests, we'll place them in the `/tests/` folder

`/tests/foo.ts`
```ts
import { expect } from 'chai'
import { setup, group, test } from 'epk'

test('this test succeed', () => {
  expect(1).to.equal(1)
})

group('a group name', () => {
  setup(() => {
    console.log('this log will show up before any tests in this group run')
  })

  test('asynchronous test that succeeds', async () => {
    expect(true).to.equal(true)
  })
  test('a test that returns without erroring is a succeeding test', () => {})
  test.skip('a test that gets skipped(doesn\'t get run)', () => {
    throw new Error('thrown error message')
  })
  test('a test that fails!', () => {
    throw new Error('thrown error message')
  })
})
```

and running `npx epk`
should result in ![EPK cli results](https://github.com/banou26/epk/blob/master/docs/readme-tests-results-1.png?raw=true)

And you're set!

If you need more complex testing environments, you can customize both esbuild and playwright configurations as well as sideloaded extensions as shown in this more advanced configuration:

```ts
import type { EPKConfig } from 'epk'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { readFile } from 'fs/promises'

import { devices } from 'playwright'

const __dirname = globalThis.__dirname ?? dirname(fileURLToPath(import.meta.url))

const config: EPKConfig = {
  configs: [
    {
      name: 'my advanced configuration',
      platform: 'chromium',
      /**
       * The chromium instance will run with these options, you can read more about what you can do with that here:
       * https://playwright.dev/docs/api/class-browser#browser-new-context
       */
      browserConfig: {
        headless: false, // run headfull 
        devtools: true // run with devtools open! Useful for debugging things
      },
      device: devices['iPhone 11 Pro'], // This forces chromium to use an Iphone 11 user agent and resolutions
      extensions: [extensionPath], // this is a sideloaded extension that will be enabled during your tests
      maxContexts: 10, // This limits the amount of pages open at the same time, useful to reduce CPU usage
      web: {
        match: ['./tests/unit/web/**/*.ts'] // tests that will run in web pages
      },
      contentScript: {
        /**
         * Tests that will run in content scripts contexts, they will have full access to
         * content script APIs, You can read more about them here:
         * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts
         */
        match: ['./tests/unit/content-script/**/*.ts']
      },
      backgroundScript: {
        /**
         * Same as for content scripts, but for extensions background pages! More information here:
         * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Background_scripts
         */
        match: ['./tests/unit/background-script/**/*.ts']
      },
      // Here we can specify how our tests are built, for this EPK uses the great esbuild, you can learn more about esbuild here: https://esbuild.github.io/
      esbuild: {
        bundle: true,
        format: 'esm',
        platform: 'browser',
        loader: {
          '.js': 'jsx',
          '.ts': 'tsx',
        },
        resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs'],
        minify: process.env.NODE_ENV !== 'development',
        sourcesContent: true,
        logLevel: 'error',
        sourcemap: 'external',
        write: false
      }
    }
  ]
}

export default config
```

For more advanced tests, EPK also supports more advanced constructs to help you test complicated scenarios

```ts
import { epkEvalHandle, expect, group, runInUrls, setup, test, waitForSelector } from 'epk'

const urls = ['https://example.com/', 'https://developer.mozilla.org/en-US/']

/**
 * Groups are able to customize the environment tests will run in,
 * "runInUrls" is a default function that EPK provides to automatically
 * run every tests, on every pages that are included in the array of url provided,
 * so for example, our tests, will run 2 times, once in https://example.com/ and once in 
 * https://developer.mozilla.org/en-US/
 */
group.use(runInUrls, [urls])('Nudge play button', () => {

  test('click starts playback', async () => {
    /**
     * This amazing function allows you to use Playwright's waitForSelector function,
     * it is just like document.querySelector, but way more powerful, it has the ability to pierce
     * through shadow dom, wait for certain states(in or out of document), or even select based on xy
     * positions compared to another element.
     * You can read more about it here:
     * https://playwright.dev/docs/selectors
     * and
     * https://playwright.dev/docs/api/class-page#page-wait-for-selector
     */
    await waitForSelector('input:right-of(:text("Username"))')
  })

  test.serial('scrub seek forward', async () => {
    const element = await waitForSelector('input:right-of(:text("Username"))')
    /**
     * This is another really powerful way to interact with the pages you're trying to test
     * Using `epkEvalHandle` allow you to run code in the runner context, with references to
     * elements in your test page!
     * This allow you to invoke function like page.mouse.move(x,y) and others from playwright's API!
     * 
     * General information about playwright's API here:
     * https://playwright.dev/docs/api/
     * 
     * and more specifically about element handles here:
     * https://playwright.dev/docs/api/class-elementhandle
     */
    await epkEvalHandle(async ({ page }, seekbar) => {
      const pos = await seekbar.boundingBox()
      await page.mouse.move(pos.x, pos.y)
      await page.mouse.down()
      await page.mouse.move(pos.x + pos.width / 2, pos.y + pos.height / 2)
      await page.mouse.up()
    }, seekbar as unknown as ElementHandle)
  })
})
```
