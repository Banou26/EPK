import type { TestRun } from '../types'

import { from, merge, Observable, of, partition } from 'rxjs'
import { endWith, filter, map, mergeMap, scan, share, switchMap } from 'rxjs/operators'

import esbuild from './esbuild'
import { createContext } from '../platforms'
import { Event, Task } from '../utils/runtime'
import { parseErrorStack } from '../stacktrace'
import { configFileWatcher } from './config'
import runTests from './test'

const keepNewTests = (oldTests: TestRun[] = [], newTests: TestRun[] = []) =>
  [
    ...oldTests.filter(test => !newTests.some(({ test: { name } }) => name === test.test.name)),
    ...newTests ?? []
  ]

export default ({ configPath, watch }: { configPath: string, watch?: boolean }) =>
  configFileWatcher({ path: configPath, watch })
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
                                    map(({ data: { groups, tests } }: Event<'register'> ) => ({ groups, tests })),
                                    // take(1),
                                    share(),
                                  )

                              const runTest =
                                register
                                  .pipe(
                                    map(({ groups, tests }) => ({
                                      type: 'run',
                                      data: { groups, tests }
                                    } as Task<'run'>)),
                                    runTests({ build, config, output, runInContext }),
                                    share()
                                    // takeWhile(({ data }) => !('done' in data), true),
                                  )
                              const [testLogsStream, testStream] = partition(runTest, (val) => val.type === 'log') as [Observable<Event<"log">>, Observable<Event<"error"> | Event<"run">>]
                              const test =
                                testStream
                                  .pipe(
                                    filter(({ type }) => type === 'run'),
                                    map(({ data, data: { groups, tests, done }, ...rest }: Event<'run'>) => ({ ...rest, groupsRuns: groups, testsRuns: tests, done })),
                                    mergeMap(async ({ groupsRuns, testsRuns, ...rest }) => ({
                                      ...rest,
                                      groupsTestsRuns:
                                        (await Promise.all(
                                          groupsRuns.flatMap(async (group) => ({
                                            ...group,
                                            tests:
                                              await Promise.all(
                                                group.tests.flatMap(async testRun => {
                                                  if (testRun.status === 'success' || testRun.status === 'skip') return testRun
                                                  const error = parseErrorStack({ group: true, errorStack: testRun.errorStack, originalStack: testRun.originalStack, sourceMapString: output.sourcemap.text })
                                                  return {
                                                    group,
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
                                          if (testRun.status === 'success' || testRun.status === 'skip') return testRun
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
                                    // groupsTestsRuns: ev.type === 'run' ? ev.groupsTestsRuns : [],
                                    // testsRuns: ev.type === 'run' ? ev.testsRuns : []
                                    ...file,
                                    events: [...file.events, ev],
                                    groupsTestsRuns: [
                                      ...file.groupsTestsRuns.filter(group => !ev.groupsTestsRuns?.some(({ name }) => name === group.name)),
                                      ...ev.groupsTestsRuns ?? []
                                    ].map(group => ({
                                      ...group,
                                      tests: keepNewTests(file.groupsTestsRuns.find(({ name }) => name === group.name)?.tests, group.tests)
                                    })), // ev.type === 'run' ? ev.groupsTestsRuns : [],
                                    testsRuns: keepNewTests(file.testsRuns, ev.testsRuns) // [...file.testsRuns.filter(test => ev.testsRuns.some(({ name }) => name !== test.name)), ...ev.testsRuns ?? []]// ev.type === 'run' ? ev.testsRuns : []
                                  }), {
                                    path: output.originalPath,
                                    build,
                                    output,
                                    config,
                                    events: [],
                                    groupsTestsRuns: [],
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
