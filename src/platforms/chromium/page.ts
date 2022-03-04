import type { BuildOutputFile, TestConfig } from '../../types'
import type{ BrowserContext, ConsoleMessage, Page } from 'playwright'
import type { Event, Task } from '../../utils/runtime'
import type { EPKPage } from './types'

import { dirname, join } from 'path'
import { randomUUID } from 'crypto'
import { fileURLToPath } from 'url'

import { toGlobal } from '../../utils/runtime'
import { eventToEpkEvent } from './utils'

// @ts-ignore
const __dirname: string = __dirname ?? dirname(fileURLToPath(import.meta.url))

export const newPage =
  async <T extends BuildOutputFile>({ config, output, browser, extensionId }: { config: TestConfig, output: T, browser: BrowserContext, extensionId: number }) => {
    if (output.environment !== 'content-script') {
      const page = await browser.newPage() as EPKPage
      await prepareContext({ config, extensionId, output, page })
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

    await prepareContext({ config, extensionId, output, page, tabId, backgroundPage })

    return {
      page,
      tabId,
      backgroundPage
    }
  }

export const prepareContext = async ({ config, extensionId, output, page, tabId, backgroundPage }: { config: TestConfig, page: EPKPage, tabId?: number, backgroundPage?: EPKPage, output: BuildOutputFile, extensionId: number }) => {
  if (output.environment === 'background-script') {
    await page.goto(`chrome-extension://${extensionId}/_generated_background_page.html`)
  }
  await page.exposeBinding(toGlobal('event'), (_, event: Event) => page.emit(eventToEpkEvent(event.type), event.data))
  page.on('console', msg => {
    const type = msg.type()
    if(!msg.text().includes('[EPK-LOG]')) return
    const text = msg.text().replace('[EPK-LOG]', '')
    if (config.logLevel === 'none') return
    if (type === 'error') page.emit(eventToEpkEvent('log'), { error: text })
    if (config.logLevel === 'error') return
    if (type === 'warning') page.emit(eventToEpkEvent('log'), { warn: text })
    if (config.logLevel === 'warn') return
    if (type === 'info') page.emit(eventToEpkEvent('log'), { info: text })
    if (config.logLevel === 'info') return
    if (type === 'log') page.emit(eventToEpkEvent('log'), { log: text })
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

export const sendTask = async ({ task, output, page, tabId, backgroundPage }: { task: Task, page: EPKPage, tabId: number, backgroundPage: EPKPage, output: BuildOutputFile }) => {
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
