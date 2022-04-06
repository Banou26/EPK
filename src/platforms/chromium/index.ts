import type{ BrowserContext } from 'playwright'

import type { Task, TaskEvents } from '../../utils/runtime'
import type { BuildOutputFile, Describe, Test, TestConfig } from '../../types'

import { cwd } from 'process'
import { rm } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

import { merge, Observable } from 'rxjs'
import { filter, finalize, scan, switchMap, tap } from 'rxjs/operators'

import { newPage, sendTask, prepareContext } from './page'
import { createContext, enableExtension } from './browser'
import { runInNewContext, runInThisContext } from 'vm'
import { EPKPage } from './types'
import { describes } from '../../runtime/test'

// @ts-ignore
const __dirname: string = __dirname ?? dirname(fileURLToPath(import.meta.url))

let runId = 0

const runDescribeWithUse = ({ describe, output, config, browser: _browser, extensionId }: { describe: Describe, config: TestConfig, output?: BuildOutputFile, browser: Promise<BrowserContext>, extensionId?: number }) =>
  new Observable(observer => {
    let pages: { page: EPKPage, tabId: number, backgroundPage: EPKPage }[] = []
    let epkRunDone
    const getPage = () => {
      return (
        _browser
          .then(async browser => {
            const page = await newPage({ output, config, browser, extensionId, skipPrepare: true }) as { page: EPKPage, tabId: number, backgroundPage: EPKPage }
            pages = [...pages, page]
            return page
          })
      )
    }
    const run = ({ page, tabId, backgroundPage }: { page: EPKPage, tabId: number, backgroundPage: EPKPage }, data: any) =>
      new Promise(resolve => {
        const _page = page
        _page.on('epkLog', data => observer.next({ type: 'log', data }))
        _page.on('epkError', data => observer.next({ type: 'error', data }))
        _page.on('epkRegister', data => observer.next({ type: 'register', data }))
        _page.on('epkRun', data => {
          // @ts-ignore
          if (!data.done) return
          // console.log('epkRun', data)
          epkRunDone = data
          resolve(data.describes.find(({ name }) => name === describe.name))
        })
        // console.log('sending TASK', task)
        sendTask({
          task: {
            type: 'run',
            data: {
              describes: [describe],
              tests: [],
            }
          },
          output,
          page,
          tabId,
          backgroundPage
        })
      })
    try {
      // console.log('describe.useArguments', describe.useArguments)
      const func = runInThisContext(
        // @ts-ignore
        describe.useFunction as string,
        // { console },
        { timeout: 1000, filename: '__epk_generated_use.js' }
      )
      const funcRes = func(
        {
          getPage,
          run,
          prepareContext: ({ page, tabId, backgroundPage }) =>
            prepareContext({ config, extensionId, output, page, tabId, backgroundPage })
        },
        describe.useArguments
      )
      funcRes
        .then(data => {
          // console.log('describe.name ran', data)
          observer.next({
            type: 'run',
            data: ({
              ...epkRunDone,
              describes:
                epkRunDone
                  .describes
                  .map(_describe =>
                    _describe.name === describe.name
                      ? data
                      : _describe
                  )
            })
          })
        })
      
      // funcRes
      //   .then(res => console.log('funcRes then', res))
      //   .catch(err => console.log('funcRes catch', err))
      // console.log('funcRes', funcRes)
    } catch (err) {
      // console.log('FUNC ERRRRRRRRRRR', err)
    }
    return () => {
      for (const { page } of pages) {
        page.close()
      }
    }
  })

const runRootTestsAndVanillaDescribes = ({ browser: _browser, output, config, extensionId, task, tests, describes }: ({ task: Task } | { tests: Test[], describes: Describe[] }) & { config: TestConfig, output?: BuildOutputFile, browser: Promise<BrowserContext>, extensionId?: number }) =>
  new Observable(observer => {
    const _page = _browser.then(browser => newPage({ output, config, browser, extensionId }))
    _page
      .then(async ({ page, tabId, backgroundPage }) => {
        const _page = page
        _page.on('epkLog', data => observer.next({ type: 'log', data }))
        _page.on('epkError', data => observer.next({ type: 'error', data }))
        _page.on('epkRegister', data => observer.next({ type: 'register', data }))
        _page.on('epkRun', data => observer.next({ type: 'run', data }))
        const _task =
          task ?? {
            type: 'run',
            data: {
              describes,
              tests
            }
          }
        await sendTask({ task: _task, output, page, tabId, backgroundPage })
      })
      .catch(err => console.log('chrome err', err))

    return () => _page.then(({ page }) => page.close())
  })

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
          _browser = createContext({
            userDataDir: join(cwd(), `tmp/platform/chromium/${id}`),
            options: {
              headless: false,
              devtools: true,
              args: [
                `--disable-extensions-except=${extensionPath}`,
                // ` --load-extension='./chrome_extensions/lmhkpmbekcpmknklioeibfkpmmfibljd/2.17.0_0,./chrome_extensions/fmkadmapgofadopljbjfkapdkoienihi/3.6.0_0'`
                `--load-extension=${extensionPath}`
              ],
              bypassCSP: true
            }
          }).then(async context => {
            await enableExtension({ context, extensionName: 'EPK' })
            return context
          })
        }
        contextsInUse++
        // @ts-ignore
        return (
          observable
            .pipe(
              switchMap(task => {
                if (task.type === 'register') return runRootTestsAndVanillaDescribes({ task, browser: _browser, output, config, extensionId })
                const useDescribes = task.data?.describes.filter(({ useFunction }) => !!useFunction) ?? []
                const vanillaDescribes = task.data?.describes.filter(describe => !useDescribes.includes(describe)) ?? []
                return merge(
                  ...useDescribes.map(describe => runDescribeWithUse({ browser: _browser, output, config, extensionId, describe })),
                  runRootTestsAndVanillaDescribes({ browser: _browser, output, config, extensionId, describes: vanillaDescribes, tests: task.data?.tests })
                )
              }),
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


                // console.log('TASK', task)
                // const describesWithUse = task.data?.describes.filter(({ useFunction }) => !!useFunction) ?? []
                // if (task.type === 'run' && describesWithUse.length) {
                //   return new Observable(observer => {
                //     let pages: { page: EPKPage, tabId: number, backgroundPage: EPKPage }[] = []
                //     for (const describe of describesWithUse) {
                //       let epkRunDone
                //       const getPage = () => {
                //         return (
                //           _browser
                //             .then(async browser => {
                //               const page = await newPage({ output, config, browser, extensionId, skipPrepare: true }) as { page: EPKPage, tabId: number, backgroundPage: EPKPage }
                //               pages = [...pages, page]
                //               return page
                //             })
                //         )
                //       }
                //       const run = ({ page, tabId, backgroundPage }: { page: EPKPage, tabId: number, backgroundPage: EPKPage }, data: any) =>
                //         new Promise(resolve => {
                //           const _page = page
                //           _page.on('epkLog', data => observer.next({ type: 'log', data }))
                //           _page.on('epkError', data => observer.next({ type: 'error', data }))
                //           _page.on('epkRegister', data => observer.next({ type: 'register', data }))
                //           _page.on('epkRun', data => {
                //             // @ts-ignore
                //             if (!data.done) return
                //             // console.log('epkRun', data)
                //             epkRunDone = data
                //             resolve(data.describes.find(({ name }) => name === describe.name))
                //           })
                //           // console.log('sending TASK', task)
                //           sendTask({
                //             task: {
                //               ...task,
                //               data: {
                //                 describes: [describe],
                //                 tests: [],
                //               }
                //             },
                //             output,
                //             page,
                //             tabId,
                //             backgroundPage
                //           })
                //         })
                //       try {
                //         // console.log('describe.useArguments', describe.useArguments)
                //         const func = runInThisContext(
                //           // @ts-ignore
                //           describe.useFunction as string,
                //           // { console },
                //           { timeout: 1000, filename: '__epk_generated_use.js' }
                //         )
                //         const funcRes = func(
                //           {
                //             getPage,
                //             run,
                //             prepareContext: ({ page, tabId, backgroundPage }) =>
                //               prepareContext({ config, extensionId, output, page, tabId, backgroundPage })
                //           },
                //           describe.useArguments
                //         )
                //         funcRes
                //           .then(data => {
                //             // console.log('describe.name ran', data)
                //             observer.next({
                //               type: 'run',
                //               data: ({
                //                 ...epkRunDone,
                //                 describes:
                //                   epkRunDone
                //                     .describes
                //                     .map(_describe =>
                //                       _describe.name === describe.name
                //                         ? data
                //                         : _describe
                //                     )
                //               })
                //             })
                //           })
                        
                //         // funcRes
                //         //   .then(res => console.log('funcRes then', res))
                //         //   .catch(err => console.log('funcRes catch', err))
                //         // console.log('funcRes', funcRes)
                //       } catch (err) {
                //         // console.log('FUNC ERRRRRRRRRRR', err)
                //       }
                //     }
                //     return () => {
                //       for (const { page } of pages) {
                //         page.close()
                //       }
                //     }
                //   }).pipe(
                //     // filter(task => task.type === 'run'),
                //     // tap(val => console.log('PAAAAAAAATTTTTT', val)),
                //     // scan(((accTask, task) => ({
                //     //   ...accTask,
                //     //   ...task,
                //     //   data: {
                //     //     ...accTask.data,
                //     //     ...task.data,
                //     //     describes: [
                //     //       ...accTask.data?.describes?.filter(describe => describe.name !== task.data?.describes?.[0]?.name) ?? [],
                //     //       task.data?.describes?.[0]
                //     //     ].flat()
                //     //   }
                //     // }))),
                //     // tap(val => console.log('TAPPPPPPPPPPP', val))
                //   )
                // }