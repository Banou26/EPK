import type { TestConfig } from '../types'
import type { BuildOutputFile } from 'src/core/esbuild'

import { dirname, join } from 'path'
import { rm } from 'fs/promises'
import { fileURLToPath } from 'url'

import { chromium } from 'playwright'
import { cwd } from 'process'
import { Observable } from 'rxjs'

import { finalize, switchMap } from 'rxjs/operators'
import { Task, toGlobal } from 'src/utils/runtime'

const __dirname = dirname(fileURLToPath(import.meta.url))
let runId = 0

export default ({ config, output }: { config: TestConfig, output: BuildOutputFile }) => {
  const id = runId++
  let _browser

  let contextsInUse = 0

  return (
    ({ options } = {}) =>
      (observable: Observable<Task>) => {
        if (!_browser) {
          const extensionPath = join(__dirname, '../extension')
          _browser = chromium.launchPersistentContext(join(cwd(), `tmp/platform/chromium/${id}`), {
            headless: false,
            devtools: true,
            args: [
              `--disable-extensions-except=${extensionPath}`,
              `--load-extension=${extensionPath}`
            ]
          }).then(async (context) => {
            const extensionPage = await context.newPage()
            await extensionPage.goto('chrome://extensions/')
            await extensionPage.click('#devMode')
            await extensionPage.reload()
            const extensionId = (await (await extensionPage.waitForSelector('#extension-id', { state: 'attached' })).textContent())?.replace('ID: ', '')
            await extensionPage.goto(`chrome://extensions/?id=${extensionId}`)
            await extensionPage.click('#allow-incognito #knob')
            await extensionPage.click('#inspect-views > li:nth-child(2) > a')
            await extensionPage.selectOption('#hostAccess', 'ON_ALL_SITES')
            // await extensionPage.close()
            return context
          })
        }
        contextsInUse++
        return (
          observable
            .pipe(
              switchMap(val =>
                new Observable(observer => {
                  const _page = _browser.then(browser => browser.newPage())
                  _page.then(async page => {
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
                    await page.mainFrame().addScriptTag({ path: output.file.path, type: 'module' })
                    await page.evaluate(
                      ([task, globalVariableTaskName]) => globalThis[globalVariableTaskName].next(task),
                      [val, toGlobal('task')] as const
                    )
                  }).catch(err => console.log('chrome err', err))
                  return () => _page.then(page => page.close())
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
