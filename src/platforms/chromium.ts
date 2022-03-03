import type { BuildOutputFile, Environment, TestConfig } from '../types'
import type{ Browser, BrowserContext, ConsoleMessage, Page } from 'playwright'

import { dirname, join } from 'path'
import { rm } from 'fs/promises'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'

import playwright from 'playwright'
// import { BrowserContext, chromium, Page } from 'playwright'
import { cwd } from 'process'
import { Observable, Subscriber } from 'rxjs'

import { finalize, switchMap } from 'rxjs/operators'
import { EVENT, Event, Task, TaskEvents, toGlobal } from 'src/utils/runtime'
import EventEmitter from 'events'
import { OverloadParameters } from 'src/utils/overloads'

export type EPKPage = Omit<Page, 'on'> & {
  on<T extends Capitalize<EVENT>>(event: `epk${T}`, listener: ({ type, data }: Event<Uncapitalize<T>>) => void): EPKPage
  on<T extends OverloadParameters<Page['on']>[0]>(event: T, listener: (...arg: Parameters<Extract<OverloadParameters<Page['on']>, [T, any]>[1]>) => void): EPKPage
}

const __dirname = __dirname ?? dirname(fileURLToPath(import.meta.url))

let runId = 0

const newPageContext =
  async <T extends BuildOutputFile>({ observer, config, output, browser, extensionId }: { observer: Subscriber<unknown>, config: TestConfig, output: T, browser: BrowserContext, extensionId: number }) => {
    if (output.environment !== 'content-script') {
      const page = await browser.newPage() as EPKPage
      await prepareContext({ observer, config, extensionId, output, page })
      return { page }
    }

    const backgroundPage = await browser.newPage() as EPKPage
    await backgroundPage.goto(`chrome-extension://${extensionId}/_generated_background_page.html`)

    const { page, tabId } = await new Promise<{ page: EPKPage, tabId: number }>(async resolve => {
      const uuid = randomUUID()
      let foundPage: EPKPage
      let newPages: { page: Page, logListener: (consoleMessage: ConsoleMessage) => void }[] = []
      const pageListener = (page: Page) => {
        const logListener = (message: ConsoleMessage) => {
          const text = message.text()
          const type = message.type()
          if (type !== 'log' || !text.includes('PAGE_IDENTIFY') || !text.includes(uuid)) return
          for (const { page, logListener } of newPages) {
            page.removeListener('console', logListener)
          }
          foundPage = page as EPKPage
        }
        page.addListener('console', logListener)
        newPages = [...newPages, { page, logListener }]
      }
      browser.addListener('page', pageListener)
      const tabId = await backgroundPage.evaluate(
        (uuid) =>
          new Promise<number>(resolve => {
            chrome.tabs.create({ url: 'https://example.com' }, (tab) => {
              chrome.tabs.executeScript(tab.id, { code: `console.log('PAGE_IDENTIFY ${uuid}');console.clear();` }, () => resolve(tab.id))
            })
          }),
        uuid
      )
      browser.removeListener('page', pageListener)
      resolve({ page: foundPage, tabId })
    })

    await page.mainFrame().addScriptTag({ path: join(__dirname, './content-script-proxy.js'), type: 'module' })

    await prepareContext({ observer, config, extensionId, output, page, tabId, backgroundPage })

    return {
      page,
      tabId,
      backgroundPage
    }
  }

const prepareContext = async ({ observer, config, extensionId, output, page, tabId, backgroundPage }: { observer: Subscriber<unknown>, config: TestConfig, page: EPKPage, tabId?: number, backgroundPage?: Page, output: BuildOutputFile, extensionId: number }) => {
  if (output.environment === 'background-script') {
    await page.goto(`chrome-extension://${extensionId}/_generated_background_page.html`)
  }
  await page.exposeBinding(toGlobal('event'), (_, event) => observer.next(event))
  page.on('console', msg => {
    const type = msg.type()
    if(!msg.text().includes('[EPK-LOG]')) return
    const text = msg.text().replace('[EPK-LOG]', '')
    if (config.logLevel === 'none') return
    if (type === 'error') observer.next({ type: 'log', error: text })
    if (config.logLevel === 'error') return
    if (type === 'warning') observer.next({ type: 'log', warn: text })
    if (config.logLevel === 'warn') return
    if (type === 'info') observer.next({ type: 'log', info: text })
    if (config.logLevel === 'info') return
    if (type === 'log') observer.next({ type: 'log', log: text })
  })
  const initDone = new Promise(async resolve => {
    await page.exposeBinding(toGlobal('initDone'), () => resolve(undefined)).catch(() => {})
    if (output.environment === 'content-script') {
      await backgroundPage.evaluate(
        ([scriptContent, tabId]) =>
          new Promise(resolve => {
            chrome.tabs.executeScript(tabId, { code: scriptContent }, () => resolve(undefined))
          }),
        [output.file.text, tabId] as const
      )
      return
    }
    await page.mainFrame().addScriptTag({ path: output.file.path, type: 'module' })
    // await page.evaluate(output.file.text)
  })
  await initDone
}

export const sendTask = async ({ task, output, page, tabId, backgroundPage }: { task: Task, page: Page, tabId: number, backgroundPage: Page, output: BuildOutputFile, browser: BrowserContext }) => {
  if (output.environment === 'content-script') {
    await backgroundPage.evaluate(
      ([task, globalVariableTaskName, tabId]) =>
        new Promise(resolve => {
          chrome.tabs.executeScript(tabId, { code: `globalThis['${globalVariableTaskName}'].next(${JSON.stringify(task)})` }, () => resolve(undefined))
        }),
      [task, toGlobal('task'), tabId] as const
    )
    await backgroundPage.close()
  } else {
    await page.evaluate(
      ([task, globalVariableTaskName]) => globalThis[globalVariableTaskName].next(task),
      [task, toGlobal('task')] as const
    )
  }
}

export default ({ config, output: rootRoutput }: { config: TestConfig, output?: BuildOutputFile }) => {
  const id = runId++
  let _browser: Promise<BrowserContext>
  let extensionId
  // let backgroundPage

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
              const backgroundPage = await context.waitForEvent('backgroundpage')
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
                  const _page = _browser.then(browser => newPageContext({ observer, output, config, browser, extensionId }))
                  _page
                    .then(async ({ page, tabId, backgroundPage }) => {
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
