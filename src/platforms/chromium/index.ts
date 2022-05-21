import type{ BrowserContext } from 'playwright'

import type { Task, TaskEvents } from '../../utils/runtime'
import type { BuildOutputFile, Group, Test, TestConfig } from '../../types'

import { cwd } from 'process'
import { rm } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

import { merge, Observable } from 'rxjs'
import { filter, finalize, scan, switchMap, tap } from 'rxjs/operators'
import { newPage, sendTask, prepareContext } from './page'
import { createContext, enableExtension, getExtensions } from './browser'
import { runInNewContext, runInThisContext } from 'vm'
import { EPKPage, Extension } from './types'
import { groups } from '../../runtime/test'
import pLimit from '../../utils/page-limit'

// @ts-ignore
const __dirname: string = __dirname ?? dirname(fileURLToPath(import.meta.url))

let runId = 0

const runGroupWithUse = ({ newPageLimit, group, output, config, browser: _browser, extensionId, extensions }: { newPageLimit: Function, group: Group, config: TestConfig, output?: BuildOutputFile, browser: Promise<BrowserContext>, extensionId?: string, extensions: Extension[] }) =>
  new Observable(observer => {
    let pages: { page: EPKPage, tabId: number, backgroundPage: EPKPage }[] = []
    let epkRunDone

    const getPage = () => newPageLimit(() => {
      return (
        _browser
          .then(async browser => {
            const page = await newPage({ output, config, browser, extensionId, skipPrepare: true }) as { page: EPKPage, tabId: number, backgroundPage: EPKPage }
            pages = [...pages, page]
            return page
          })
      )
    })

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

const runRootTestsAndVanillaGroups = ({ newPageLimit, browser: _browser, output, config, extensionId, extensions, task, tests, groups }: ({ task: Task } | { tests: Test[], groups: Group[] }) & { newPageLimit: Function, config: TestConfig, output?: BuildOutputFile, browser: Promise<BrowserContext>, extensionId?: string, extensions: Extension[] }) =>
  new Observable(observer => {
    const _page = newPageLimit(() => new Promise(async (resolve, reject) => {
      const browser = await _browser
      const { page, tabId, backgroundPage } = await newPage({ output, config, browser, extensionId })
      try {
        page.on('epkLog', data => observer.next({ type: 'log', data }))
        page.on('epkError', data => observer.next({ type: 'error', data }))
        page.on('epkRegister', data => {
          observer.next({ type: 'register', data })
          observer.complete()
          resolve({ page, tabId, backgroundPage })
        })
        page.on('epkRun', data => {
          observer.next({ type: 'run', data })
          if (data.done) {
            observer.complete()
            resolve({ page, tabId, backgroundPage })
          }
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
      } catch (err) {
        console.log('chrome err', err)
      }
    }))

    return () => _page.then(({ page }) => page.close())
  })

export default ({ config, output: rootRoutput }: { config: TestConfig, output?: BuildOutputFile }) => {
  const id = runId++
  let _browser: Promise<BrowserContext>
  let extensionId: string
  let extensions: { name: string, id: string }[]
  let contextsInUse = 0
  const newPageLimit = pLimit(config.maxContexts ?? 15)

  return (
    <T extends Task>({ options, output = rootRoutput }: { options?: any, output: BuildOutputFile } = { output: rootRoutput }) =>
      (observable: Observable<T>): Observable<TaskEvents<T['type']>> => {
        if (!_browser) {
          const extensionPath = join(__dirname, '../extension')
          _browser = createContext({
            userDataDir: join(cwd(), `tmp/platform/chromium/${id}`),
            options: {
              bypassCSP: true,
              headless: config.extensions?.length ? false : true,
              ...config.browserConfig ?? {},
              ...config.device ?? {},
              args: [
                ...config.browserConfig?.args ?? [],
                `--disable-extensions-except=${[extensionPath, ...config.extensions ?? []].join(',')}`,
                // ` --load-extension='./chrome_extensions/lmhkpmbekcpmknklioeibfkpmmfibljd/2.17.0_0,./chrome_extensions/fmkadmapgofadopljbjfkapdkoienihi/3.6.0_0'`
                `--load-extension=${[extensionPath, ...config.extensions ?? []].join(',')}`
              ]
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
                if (task.type === 'register') return runRootTestsAndVanillaGroups({ newPageLimit, task, browser: _browser, output, config, extensionId, extensions })
                const useGroups = task.data?.groups.filter(({ useFunction }) => !!useFunction) ?? []
                const vanillaGroups = task.data?.groups.filter(group => !useGroups.includes(group)) ?? []
                return merge(
                  ...useGroups.map(group => runGroupWithUse({ newPageLimit, browser: _browser, output, config, extensionId, extensions, group })),
                  runRootTestsAndVanillaGroups({ newPageLimit, browser: _browser, output, config, extensionId, extensions, groups: vanillaGroups, tests: task.data?.tests })
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