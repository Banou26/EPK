import type{ BrowserContext } from 'playwright'

import type { Task, TaskEvents } from '../../utils/runtime'
import type { BuildOutputFile, TestConfig } from '../../types'

import { cwd } from 'process'
import { rm } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

import { Observable } from 'rxjs'
import { finalize, switchMap } from 'rxjs/operators'

import { newPage, sendTask } from './page'

const __dirname = __dirname ?? dirname(fileURLToPath(import.meta.url))

let runId = 0

export default ({ config, output: rootRoutput }: { config: TestConfig, output?: BuildOutputFile }) => {
  const id = runId++
  let _browser: Promise<BrowserContext>
  let extensionId
  let contextsInUse = 0

  return (
    <T extends Task>({ options, output = rootRoutput }: { options?: any, output: BuildOutputFile } = { output: rootRoutput }) =>
      (observable: Observable<T>): Observable<TaskEvents<T['type']>> => {
        if (!_browser) {
          const extensionPath = join(__dirname, '../extension')
          _browser = import('playwright')
            .then(playwright =>
              playwright.chromium.launchPersistentContext(join(cwd(), `tmp/platform/chromium/${id}`), {
                headless: false,
                devtools: true,
                args: [
                  `--disable-extensions-except=${extensionPath}`,
                  // ` --load-extension='./chrome_extensions/lmhkpmbekcpmknklioeibfkpmmfibljd/2.17.0_0,./chrome_extensions/fmkadmapgofadopljbjfkapdkoienihi/3.6.0_0'`
                  `--load-extension=${extensionPath}`
                ],
                bypassCSP: true
              })
            )
            .then(async (context) => {
              await context.waitForEvent('backgroundpage')
              const extensionPage = await context.newPage()
              await extensionPage.goto('chrome://extensions/')
              await extensionPage.click('#devMode')
              await extensionPage.reload()
              extensionId = (await (await extensionPage.waitForSelector('#extension-id:below(div#name:has-text("EPK"), 200)', { state: 'attached' })).textContent())?.replace('ID: ', '')
              await extensionPage.goto(`chrome://extensions/?id=${extensionId}`)
              await extensionPage.click('#allow-incognito #knob')
              await extensionPage.selectOption('#hostAccess', 'ON_ALL_SITES')
              // await extensionPage.click('#inspect-views > li:nth-child(2) > a')
              await extensionPage.close()
              return context
            })
        }
        contextsInUse++
        // @ts-ignore
        return (
          observable
            .pipe(
              switchMap(task =>
                new Observable(observer => {
                  const _page = _browser.then(browser => newPage({ output, config, browser, extensionId }))
                  _page
                    .then(async ({ page, tabId, backgroundPage }) => {
                      const _page = page
                      _page.on('epkLog', data => observer.next({ type: 'log', data }))
                      _page.on('epkError', data => observer.next({ type: 'error', data }))
                      _page.on('epkRegister', data => observer.next({ type: 'register', data }))
                      _page.on('epkRun', data => observer.next({ type: 'run', data }))
                      _page.on('epkRuns', data => observer.next({ type: 'runs', data }))
                      await sendTask({ task, output, page, tabId, backgroundPage })
                    })
                    .catch(err => console.log('chrome err', err))

                  return () => _page.then(({ page }) => page.close())
                })
              ),
              finalize(async () => {
                contextsInUse--
                if (contextsInUse === 0) {
                  const browser = await _browser
                  _browser = undefined
                  await browser.close()
                }
                await rm(join(cwd(), `tmp/platform/chromium/${id}`), { recursive: true, maxRetries: 5, retryDelay: 500 }).catch((err) => {})
              })
            )
        )
      }
  )
}
