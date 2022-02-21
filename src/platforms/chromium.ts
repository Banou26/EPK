import type { TestConfig } from '../types'
import type { BuildOutputFile } from 'src/core/esbuild'

import { join } from 'path'

import { chromium } from 'playwright'
import { cwd } from 'process'
import { Observable } from 'rxjs'

import { finalize, switchMap } from 'rxjs/operators'
import { Task, toGlobal } from 'src/utils/runtime'
import { rm } from 'fs/promises'

let runId = 0

export default ({ config, output }: { config: TestConfig, output: BuildOutputFile }) => {
  const id = runId++
  let _browser

  let contextsInUse = 0

  return (
    ({ options } = {}) =>
      (observable: Observable<Task>) => {
        if (!_browser) {
          _browser = chromium.launchPersistentContext(join(cwd(), `tmp/platform/chromium/${id}`), {
            headless: false,
            devtools: true
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
