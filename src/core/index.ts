import type { EPKConfig, TestConfig, TestRun } from '../types'

import { from, merge, Observable, of, partition } from 'rxjs'
import { endWith, filter, map, mapTo, mergeMap, scan, share, switchMap, take, takeWhile, tap } from 'rxjs/operators'
import { SourceMapConsumer } from 'source-map-js'

import esbuild from './esbuild'
import { createContext } from '../platforms'
import { readFile, watch } from 'fs/promises'
import { cwd } from 'process'
import { join, relative } from 'path'
import { Event, Task } from '../utils/runtime'
import { parseErrorStack } from '../stacktrace'
import { pathToFileURL } from 'url'

const keepNewTests = (oldTests: TestRun[] = [], newTests: TestRun[] = []) =>
  [
    ...oldTests.filter(test => !newTests.some(({ test: { name } }) => name === test.test.name)),
    ...newTests ?? []
  ]

const configFileWatcher = (path: string) =>
  new Observable<EPKConfig>(observer => {
    const fileUrlPath = pathToFileURL(undefined ?? join(cwd(), './test.config.js')).toString()

    import(fileUrlPath)
      .then(({ default: config }: { default: EPKConfig }) =>
        observer.next(config)
      )

    const { signal, abort } = new AbortController()
    const watcher = watch(path, { signal })
    ;(async () => {
      try {
        for await (const event of watcher) {
          const { default: config }: { default: EPKConfig } = await import(`${fileUrlPath}?t=${Date.now()}`)
          if (event.eventType === 'change') observer.next(config)
        }
      } catch (err) {
        if (err.name === 'AbortError') return
        throw err
      }
    })()
    return () => abort()
  })

export default ({ configPath, watch }: { configPath: string, watch?: boolean }) =>
  configFileWatcher(configPath)
    .pipe(
      switchMap(config =>
        from(config.configs)
          .pipe(
            mergeMap((config) => {
              const buildStream = esbuild({ testConfig: config, esbuildOptions: config.esbuild, watch })

              const [_build, other] = partition(buildStream, build => build.name === 'success')

              const build =
                _build
                  .pipe(
                    map(build => ({ type: 'build', name: 'success', build, config }) as const)
                  )

              const test =
                build
                  .pipe(
                    switchMap(({ build, config }) => {
                      const runInContext = createContext({ config })
                      return (
                        from(build.outputs)
                          .pipe(
                            mergeMap((output) => {
                              const runRegister =
                                of({ type: 'register' } as Task<'register'>)
                                  .pipe(
                                    runInContext({ output })
                                  )
                              const [registerLogsStream, registerStream] = partition(runRegister, (val) => val.type === 'log') as [Observable<Event<"log">>, Observable<Event<"error"> | Event<"register">>]
                              const register =
                                registerStream
                                  .pipe(
                                    filter(({ type }) => type === 'register'),
                                    map(({ data: { describes, tests } }: Event<'register'> ) => ({ describes, tests })),
                                    // tap(val => console.log('val', val)),
                                    // take(1),
                                    share(),
                                    // tap(val => console.log('val', val))
                                  )

                              const runTest =
                                register
                                  .pipe(
                                    // tap(val => console.log('val2', val)),
                                    map(({ describes, tests }) => ({
                                      type: 'run',
                                      data: { describes, tests }
                                    } as Task<'run'>)),
                                    runInContext({ output }),
                                    share()
                                    // takeWhile(({ data }) => !('done' in data), true),
                                  )
                              const [testLogsStream, testStream] = partition(runTest, (val) => val.type === 'log') as [Observable<Event<"log">>, Observable<Event<"error"> | Event<"run">>]
                              const test =
                                testStream
                                  .pipe(
                                    filter(({ type }) => type === 'run'),
                                    map(({ data, data: { describes, tests, done }, ...rest }: Event<'run'>) => ({ ...rest, describesRuns: describes, testsRuns: tests, done })),
                                    mergeMap(async ({ describesRuns, testsRuns, ...rest }) => ({
                                      ...rest,
                                      describesTestsRuns:
                                        (await Promise.all(
                                          describesRuns.flatMap(async (describe) => ({
                                            ...describe,
                                            tests:
                                              await Promise.all(
                                                describe.tests.flatMap(async testRun => {
                                                  if (testRun.status === 'success') return testRun
                                                  const error = parseErrorStack({ describe: true, errorStack: testRun.errorStack, originalStack: testRun.originalStack, sourceMapString: output.sourcemap.text })
                                                  return {
                                                    describe,
                                                    ...testRun,
                                                    error
                                                  }
                                                })
                                              )
                                          }))
                                        ))
                                        .flat(),
                                      testsRuns:
                                        await Promise.all(testsRuns.map(async testRun => {
                                          if (testRun.status === 'success') return testRun
                                          const error = parseErrorStack({ errorStack: testRun.errorStack, originalStack: testRun.originalStack, sourceMapString: output.sourcemap.text })
                                          return {
                                            ...testRun,
                                            error
                                          }
                                        }))
                                    })),
                                    // takeWhile(({ done }) => !done, true)
                                  )

                              return (
                                merge(
                                  of(build),
                                  // registerLogsStream,
                                  testLogsStream,
                                  register,
                                  test
                                ).pipe(
                                  endWith({
                                    type: 'status'
                                  }),
                                  map(val => ({
                                    output,
                                    path: output.file.path,
                                    ...val,
                                  })),
                                  scan((file, ev) => ({
                                    // ...file,
                                    // events: [...file.events, ev],
                                    // describesTestsRuns: ev.type === 'run' ? ev.describesTestsRuns : [],
                                    // testsRuns: ev.type === 'run' ? ev.testsRuns : []
                                    ...file,
                                    events: [...file.events, ev],
                                    describesTestsRuns: [
                                      ...file.describesTestsRuns.filter(describe => !ev.describesTestsRuns?.some(({ name }) => name === describe.name)),
                                      ...ev.describesTestsRuns ?? []
                                    ].map(describe => ({
                                      ...describe,
                                      tests: keepNewTests(file.describesTestsRuns.find(({ name }) => name === describe.name)?.tests, describe.tests)
                                    })), // ev.type === 'run' ? ev.describesTestsRuns : [],
                                    testsRuns: keepNewTests(file.testsRuns, ev.testsRuns) // [...file.testsRuns.filter(test => ev.testsRuns.some(({ name }) => name !== test.name)), ...ev.testsRuns ?? []]// ev.type === 'run' ? ev.testsRuns : []
                                  }), {
                                    path: output.originalPath,
                                    build,
                                    output,
                                    config,
                                    events: [],
                                    describesTestsRuns: [],
                                    testsRuns: []
                                  })
                                )
                              )
                            })
                          )
                      )
                    })
                  )

              return merge(
                // build,
                test
                  .pipe(
                    scan((configTest, testFile) => ({
                      ...configTest,
                      name: config.name,
                      files: [...configTest.files.filter(({ path }) => path !== testFile.path), testFile]
                    }), {
                      name: config.name,
                      files: []
                    })
                  )
              )
            }),
            scan((configTests, configTest) => ({
              ...configTests,
              configs: [...configTests.configs.filter(({ name }) => name !== configTest.name), configTest]
            }), {
              workers: config.workers,
              configs: []
            })
          )
      )
    )
