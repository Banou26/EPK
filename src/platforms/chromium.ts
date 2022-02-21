import type { TestConfig } from '../types'
import type { BuildOutputFile } from 'src/core/esbuild'

import { join } from 'path'

import playwright from 'playwright'
import { cwd } from 'process'
import { Observable } from 'rxjs'

import { finalize, switchMap } from 'rxjs/operators'
import { Task, toGlobal } from 'src/utils/runtime'
import { rm } from 'fs/promises'

let runId = 0

export default ({ config, output }: { config: TestConfig, output: BuildOutputFile }) => {
  const id = runId++
  const _browser = playwright.chromium.launchPersistent(join(cwd(), `tmp/platform/chromium/${id}`), {
    headless: false,
    devtools: true
  })

  return (
    ({ options } = {}) =>
      (observable: Observable<Task>) =>
        observable
          .pipe(
            switchMap(val =>
              new Observable(observer => {
                const _page = _browser.then(browser => browser.newPage())
                _page.then(async page => {
                  await page.exposeFunction(toGlobal('event'), (event) => observer.next(event))
                  page.on('console', msg => {
                    const type = msg.type()
                    if(!msg.text().includes('[EPK-LOG]')) return
                    const text = msg.text().replace('[EPK-LOG]', '')
                    if (config.logLevel === 'none') return
                    if (type === 'error') console.error(text)
                    if (config.logLevel === 'error') return
                    if (type === 'warning') console.warn(text)
                    if (config.logLevel === 'warn') return
                    if (type === 'info') console.info(text)
                    if (config.logLevel === 'info') return
                    if (type === 'log') console.log(text)
                  })
                  await page.mainFrame().addScriptTag({ path: output.file.path, type: 'module' })
                  await page.evaluate(
                    (task, globalVariableTaskName) => globalThis[globalVariableTaskName].next(task),
                    val,
                    toGlobal('task')
                  )
                  console.log('FOO')
                }).catch(err => console.log('chrome err', err))
                // return () => _page.then(page => page.close())
              })
            ),
            finalize(async () => {
              const browser = await _browser
              await browser.close()
              await rm(join(cwd(), `tmp/platform/chromium/${id}`), { recursive: true, maxRetries: 5, retryDelay: 500 }).catch((err) => {})
            })
          )
  )
}
