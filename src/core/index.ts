import type { EPKConfig, TestConfig } from '../types'

import { from, merge, Observable, of, partition } from 'rxjs'
import { endWith, filter, map, mergeMap, scan, share, switchMap, take, tap } from 'rxjs/operators'
import { SourceMapConsumer } from 'source-map-js'

import esbuild from './esbuild'
import { createContext } from '../platforms'
import { readFile } from 'fs/promises'
import { cwd } from 'process'
import { relative } from 'path'
import { Event, Task } from 'src/utils/runtime'
import { parseErrorStack } from '../stacktrace'

export default ({ config, watch }: { config: EPKConfig, watch?: boolean }) =>
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
                              // filter(({ data: { describes, tests } }) => describes && tests),
                              map(({ data: { describes, tests } }: Event<'register'> ) => ({ describes, tests })),
                              // tap(({ describes, tests }) => console.log('register done', describes[0]?.tests, tests)),
                              take(1),
                              share()
                            )
        
                        const runTest =
                          register
                            .pipe(
                              // tap(tests => console.log('tests', tests)),
                              map(({ describes, tests }) => ({
                                type: 'run',
                                data: { describes, tests }
                              } as Task<'run'>)),
                              // tap(tests => console.log('testing done', tests)),
                              runInContext({ output }),
                              // tap(tests => console.log('testing done', tests)),
                            )
                        const [testLogsStream, testStream] = partition(runTest, (val) => val.type === 'log') as [Observable<Event<"log">>, Observable<Event<"error"> | Event<"run">>]
                        const test =
                          testStream
                            .pipe(
                              filter(({ type }) => type === 'run'),
                              filter(({ data }: Event<'run'>) => data.done),
                              // filter(({ data: { describes, tests } }) => describes && tests),
                              map(({ data, data: { describes, tests }, ...rest }: Event<'run'>) => ({ ...rest, describesRuns: describes, testsRuns: tests })),
                              mergeMap(async ({ describesRuns, testsRuns, ...rest }) => ({
                                ...rest,
                                done: true,
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
                              // tap(tests => console.log('testing done', tests)),
                              take(1)
                            )

                        return (
                          merge(
                            of(build),
                            // registerLogsStream,
                            testLogsStream,
                            register,
                            test
                          ).pipe(
                            // tap(val => console.log('val', val)),
                            endWith({
                              type: 'status'
                            }),
                            map(val => ({
                              output,
                              path: output.file.path,
                              ...val,
                            })),
                            scan((file, ev) => ({
                              ...file,
                              events: [...file.events, ev],
                              ...ev.type === 'run' && ev.done && {
                                describesTestsRuns: ev.describesTestsRuns,
                                testsRuns: ev.testsRuns
                              }
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
