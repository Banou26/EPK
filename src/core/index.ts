import type { TestRun } from '../types'

import { from, merge, Observable, of, partition } from 'rxjs'
import { endWith, filter, map, mergeMap, scan, share, switchMap } from 'rxjs/operators'

import esbuild from './esbuild'
import { createContext } from '../platforms'
import { Event, Task } from '../utils/runtime'
import { parseErrorStack } from '../stacktrace'
import { configFileWatcher } from './config'

const keepNewTests = (oldTests: TestRun[] = [], newTests: TestRun[] = []) =>
  [
    ...oldTests.filter(test => !newTests.some(({ test: { name } }) => name === test.test.name)),
    ...newTests ?? []
  ]

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
                                    mergeMap(({ data: { tests: _tests, groups: _groups } }) => {
                                      const onlyTests = _tests.filter(({ only }) => only)
                                      const onlyGroups = _groups.filter(({ only, tests }) => only || tests.some(({ only }) => only))
                                      const skipTests = _tests.filter(({ skip }) => skip)
                                      const skipGroups = _groups.filter(({ skip }) => skip)

                                      const isOnly = onlyTests.length || onlyGroups.length

                                      const nonSkipTests = _tests.filter(test => isOnly ? onlyTests.includes(test) : !skipTests.includes(test))
                                      const nonSkipGroups =
                                        _groups
                                          .filter(group => isOnly ? onlyGroups.includes(group) : !skipGroups.includes(group))
                                          .map((group) => {
                                            const onlyGroupTests = group.tests.filter(({ only }) => only)
                                            const skipGroupTests = group.tests.filter(({ skip }) => skip)
                                            const nonSkipGroupTests = group.tests.filter(test => isOnly ? onlyGroupTests.includes(test) : !skipGroupTests.includes(test))
                                            
                                            return {
                                              ...group,
                                              tests: [
                                                ...nonSkipGroupTests,
                                                ...group.tests
                                                  .filter(test =>!nonSkipGroupTests.includes(test))
                                                  .map(test => ({ ...test, skip: true }))
                                              ]
                                            }
                                          })

                                      const groups = nonSkipGroups.map((group) => ({ ...group, tests: group.tests.filter(({ skip }) => !skip) }))
                                      return (
                                        runInContext({ output })(of({ type: 'run', data: { tests: nonSkipTests, groups } }))
                                          .pipe(
                                            map(event =>
                                              event.type === 'run'
                                                ? (
                                                  {
                                                    ...event,
                                                    data: {
                                                      tests: [
                                                        ...event.data.tests,
                                                        ...(
                                                          _tests
                                                            .filter(test => !nonSkipTests.some(({ name }) => name === test.name))
                                                            .map(test => ({
                                                              test,
                                                              function: test.function,
                                                              status: 'skip',
                                                              return: undefined,
                                                              originalStack: undefined,
                                                              errorStack: undefined
                                                            }))
                                                        )
                                                      ],
                                                      groups: [
                                                        ...event.data.groups.map(group => ({
                                                          ...group,
                                                          tests: [
                                                            ...group.tests,
                                                            ...(
                                                              nonSkipGroups
                                                                .find(({ name }) => group.name === name)
                                                                .tests
                                                                .filter(test =>
                                                                  !group.tests.some(({ test: _test }) => _test.name === test.name)
                                                                )
                                                                .map(test => ({
                                                                  test,
                                                                  function: test.function,
                                                                  status: 'skip',
                                                                  return: undefined,
                                                                  originalStack: undefined,
                                                                  errorStack: undefined
                                                                }))
                                                            )
                                                          ]
                                                        })),
                                                        ...(
                                                          _groups
                                                            .filter(group => !nonSkipGroups.some(({ name }) => name === group.name))
                                                            .map(group => ({
                                                              ...group,
                                                              skip: true
                                                            }))
                                                        )
                                                      ]
                                                    }
                                                  }
                                                )
                                                : event
                                            ),
                                          )
                                      )
                                    }),
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
