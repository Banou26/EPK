import type { TestConfig } from '../core'

import { cwd } from 'process'
import { dirname, join } from 'path'
import path from 'path'
import { createServer } from 'http'

import { createReadStream } from 'fs'
import { rm } from 'fs/promises'

import mime from 'mime'

import EPK from '../core'
import configs from '../../test.config'
import cliReporter from '../reporters/cli'
import { shareReplay } from 'rxjs/operators'
import { chromium } from 'playwright'
import { fileURLToPath } from 'url'

const run = async ({ entryFiles }: { entryFiles?: string[] } = { entryFiles: [] }) => {
  await rm(join(cwd(), './tmp'), { recursive: true }).catch(() => {})

  // @ts-ignore
  const __dirname: string = __dirname ?? dirname(fileURLToPath(import.meta.url))
  
  const extensionPath = join(__dirname, '../extension')
  const context = await chromium.launchPersistentContext(join(cwd(), `tmp/platform/chromium/test`), {
    headless: false,
    devtools: true,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ]
  })
  
  const backgroundPage = await context.waitForEvent('backgroundpage')//.then(event => console.log('BACKGROUNDPAGE', event))

  const extensionPage = await context.newPage()
  await extensionPage.goto('chrome://extensions/')
  await extensionPage.click('#devMode')
  await extensionPage.reload()
  let extensionId = (await (await extensionPage.waitForSelector('#extension-id', { state: 'attached' })).textContent())?.replace('ID: ', '')
  await extensionPage.goto(`chrome://extensions/?id=${extensionId}`)
  await extensionPage.click('#allow-incognito #knob')
  await extensionPage.selectOption('#hostAccess', 'ON_ALL_SITES')

  // await extensionPage.click('#enable-section #enableToggle #knob')
  // // await new Promise(resolve => setTimeout(resolve, 5000))
  // await extensionPage.click('#enable-section #enableToggle #knob')
  await extensionPage.click('#inspect-views > li:nth-child(2) > a')
  // console.log(backgroundPage.url())
  // backgroundPage.evaluate(() => console.log('YEEEEEEEEEEEEEEEET'))
  setInterval(() => {
    console.log('context.backgroundPages()', context.backgroundPages())
  }, 1000)
  // console.log('browser.backgroundPages[0]', context.backgroundPages[0])
  // await extensionPage.close()



  // console.log(join(cwd(), './test.config.ts'))
  // const epk = EPK({ configs: await import(join(cwd(), './test.config.ts')) })
  // const server =
  //   createServer(async (req, res) => {
  //     const url = new URL(req.url, 'http://localhost:2345')
  //     res.setHeader('Access-Control-Allow-Origin', 'http://localhost:1234')
  //     try {
  //       res.setHeader('Content-Type', mime.getType(path.resolve('../tmp/', path.join('builds', url.pathname))))
  //       await new Promise((resolve, reject) =>
  //         createReadStream(path.resolve('../tmp/', path.join('builds', url.pathname)))
  //         .on('error', reject)
  //         .on('finish', resolve)
  //         .pipe(res)
  //       )
  //     } catch (err) {
  //       res.setHeader('Content-Type', mime.getType(path.resolve('./', 'builds/index.html')))
  //       createReadStream(path.resolve('../tmp/', 'builds/index.html'))
  //       .pipe(res)
  //     }
  //   })
  //   .listen(2345)
  
  // const epk =
  //   EPK({ configs: configs as TestConfig[] })
  //     .pipe(
  //       shareReplay(),
  //       cliReporter()
  //     )

  // epk.subscribe(
  //   // v => console.log('CLI', v),
  //   // err => console.error(`CLI error ${err}}`)
  // )
}

run()
