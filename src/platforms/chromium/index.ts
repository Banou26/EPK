import type{ BrowserContext } from 'playwright'

import type { Task, TaskEvents } from '../../utils/runtime'
import type { BuildOutputFile, Group, Test, TestConfig } from '../../types'

import { cwd } from 'process'
import { rm } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

import { merge, Observable } from 'rxjs'
import { filter, finalize, scan, switchMap, tap } from 'rxjs/operators'
import pLimit from 'p-limit'
import { newPage, sendTask, prepareContext } from './page'
import { createContext, enableExtension, getExtensions } from './browser'
import { runInNewContext, runInThisContext } from 'vm'
import { EPKPage, Extension } from './types'
import { groups } from '../../runtime/test'

// @ts-ignore
const __dirname: string = __dirname ?? dirname(fileURLToPath(import.meta.url))

let runId = 0

const runGroupWithUse = ({ group, output, config, browser: _browser, extensionId, extensions }: { group: Group, config: TestConfig, output?: BuildOutputFile, browser: Promise<BrowserContext>, extensionId?: string, extensions: Extension[] }) =>
  new Observable(observer => {
    let pages: { page: EPKPage, tabId: number, backgroundPage: EPKPage }[] = []
    let epkRunDone

    const newPageLimit = pLimit(config.maxContexts ?? 15)

    const _getPage = () => {
      return (
        _browser
          .then(async browser => {
            const page = await newPage({ output, config, browser, extensionId, skipPrepare: true }) as { page: EPKPage, tabId: number, backgroundPage: EPKPage }
            pages = [...pages, page]
            return page
          })
      )
    }

    const getPage = () => newPageLimit(_getPage)

    const run = ({ page, tabId, backgroundPage }: { page: EPKPage, tabId: number, backgroundPage: EPKPage }, data: any) =>
      new Promise(resolve => {
        const _page = page
        _page.on('epkLog', data => observer.next({ type: 'log', data }))
        _page.on('epkError', data => observer.next({ type: 'error', data }))
        _page.on('epkRegister', data => observer.next({ type: 'register', data }))
        _page.on('epkRun', data => {
          if (!data.done || !data.groups) return
          epkRunDone = data
          resolve(data.groups.find(({ name }) => name === group.name))
        })
        sendTask({
          task: {
            type: 'run',
            data: {
              groups: [{ ...group, useArguments: data }],
              tests: [],
              extensions
            }
          },
          output,
          page,
          tabId,
          backgroundPage
        })
      })
    try {
      // console.log('group.useArguments', group.useArguments)
      const func = runInThisContext(
        group.useFunction.toString(),
        // { console },
        { timeout: 1000, filename: '__epk_generated_use.js' }
      )
      const funcRes = func(
        {
          getPage,
          run,
          prepareContext: ({ page, tabId, backgroundPage }) =>
            prepareContext({ config, extensionId, output, page, tabId, backgroundPage }),
          extensions
        },
        group.useArguments
      )
      funcRes
        .then(data => {
          // console.log('group.name ran', data)
          observer.next({
            type: 'run',
            data: ({
              ...epkRunDone,
              groups:
                epkRunDone
                  .groups
                  .map(_group =>
                    _group.name === group.name
                      ? data
                      : _group
                  )
            })
          })
          observer.complete()
        })
        .catch(err => {
          console.log('Error during `group.use`', err)
          const [line, row] = err.stack.split('\n').at(-1).trim().replace('at __epk_generated_use.js:', '').trim().split(':').map(Number)
          console.log(group.useFunction.toString().split('\n').slice(Math.max(line - 1, 0), line + 1).join('\n'))
          // todo: complete observer after sending error object
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

const runRootTestsAndVanillaGroups = ({ browser: _browser, output, config, extensionId, extensions, task, tests, groups }: ({ task: Task } | { tests: Test[], groups: Group[] }) & { config: TestConfig, output?: BuildOutputFile, browser: Promise<BrowserContext>, extensionId?: string, extensions: Extension[] }) =>
  new Observable(observer => {
    const _page = _browser.then(browser => newPage({ output, config, browser, extensionId }))
    _page
      .then(async ({ page, tabId, backgroundPage }) => {
        const _page = page
        _page.on('epkLog', data => observer.next({ type: 'log', data }))
        _page.on('epkError', data => observer.next({ type: 'error', data }))
        _page.on('epkRegister', data => {
          observer.next({ type: 'register', data })
          observer.complete()
        })
        _page.on('epkRun', data => {
          observer.next({ type: 'run', data })
          if (data.done) observer.complete()
        })
        const _task =
          task ?? {
            type: 'run',
            data: {
              groups,
              tests,
              extensions
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
  let extensionId: string
  let extensions: { name: string, id: string }[]
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
                `--disable-extensions-except=${[extensionPath, ...config.extensions ?? []].join(',')}`,
                // ` --load-extension='./chrome_extensions/lmhkpmbekcpmknklioeibfkpmmfibljd/2.17.0_0,./chrome_extensions/fmkadmapgofadopljbjfkapdkoienihi/3.6.0_0'`
                `--load-extension=${[extensionPath, ...config.extensions ?? []].join(',')}`
              ],
              bypassCSP: true
            }
          }).then(async context => {
            extensionId = await enableExtension({ context, extensionName: 'EPK' })
            extensions = await getExtensions({ config, context })
            return context
          })
        }
        contextsInUse++
        // @ts-ignore
        return (
          observable
            .pipe(
              // wait for the browser context to be created as we need the extensionId before continuing
              switchMap(task => _browser.then(() => task)),
              switchMap(task => {
                if (task.type === 'register') return runRootTestsAndVanillaGroups({ task, browser: _browser, output, config, extensionId, extensions })
                const useGroups = task.data?.groups.filter(({ useFunction }) => !!useFunction) ?? []
                const vanillaGroups = task.data?.groups.filter(group => !useGroups.includes(group)) ?? []
                return merge(
                  ...useGroups.map(group => runGroupWithUse({ browser: _browser, output, config, extensionId, extensions, group })),
                  runRootTestsAndVanillaGroups({ browser: _browser, output, config, extensionId, extensions, groups: vanillaGroups, tests: task.data?.tests })
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
                // const groupsWithUse = task.data?.groups.filter(({ useFunction }) => !!useFunction) ?? []
                // if (task.type === 'run' && groupsWithUse.length) {
                //   return new Observable(observer => {
                //     let pages: { page: EPKPage, tabId: number, backgroundPage: EPKPage }[] = []
                //     for (const group of groupsWithUse) {
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
                //             resolve(data.groups.find(({ name }) => name === group.name))
                //           })
                //           // console.log('sending TASK', task)
                //           sendTask({
                //             task: {
                //               ...task,
                //               data: {
                //                 groups: [group],
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
                //         // console.log('group.useArguments', group.useArguments)
                //         const func = runInThisContext(
                //           // @ts-ignore
                //           group.useFunction as string,
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
                //           group.useArguments
                //         )
                //         funcRes
                //           .then(data => {
                //             // console.log('group.name ran', data)
                //             observer.next({
                //               type: 'run',
                //               data: ({
                //                 ...epkRunDone,
                //                 groups:
                //                   epkRunDone
                //                     .groups
                //                     .map(_group =>
                //                       _group.name === group.name
                //                         ? data
                //                         : _group
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
                //     //     groups: [
                //     //       ...accTask.data?.groups?.filter(group => group.name !== task.data?.groups?.[0]?.name) ?? [],
                //     //       task.data?.groups?.[0]
                //     //     ].flat()
                //     //   }
                //     // }))),
                //     // tap(val => console.log('TAPPPPPPPPPPP', val))
                //   )
                // }