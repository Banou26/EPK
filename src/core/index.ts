import type { EPKConfig, Group, Test, TestConfig, TestRun } from '../types'

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
                                    map(({ data: { groups, tests } }: Event<'register'> ) => ({ groups, tests })),
                                    // tap(val => console.log('val', val)),
                                    // take(1),
                                    share(),
                                    // tap(val => console.log('val', val))
                                  )

                              const runTest =
                                register
                                  .pipe(
                                    // tap(val => console.log('val2', val)),
                                    map(({ groups, tests }) => ({
                                      type: 'run',
                                      data: { groups, tests }
                                    } as Task<'run'>)),
                                    mergeMap(({ data: { tests: _tests, groups: _groups } }) => {
                                      // console.log('registerd', _tests, _groups)
                                      const onlyTests = _tests.filter(({ only }) => only)
                                      const onlyGroups = _groups.filter(({ only, tests }) => only || tests.some(({ only }) => only))
                                      const skipTests = _tests.filter(({ skip }) => skip)
                                      const skipGroups = _groups.filter(({ skip }) => skip)

                                      const isOnly = onlyTests.length || onlyGroups.length
                                      console.log('IS ONLY TEST', isOnly)

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

                                      const tests = [
                                        ...nonSkipTests,
                                        ..._tests
                                          .filter(test => !nonSkipTests.includes(test))
                                          .map(test => ({ ...test, skip: true }))
                                      ]
                                      // const groups = [
                                      //   ...nonSkipGroups,
                                      //   ..._groups
                                      //     .filter(group => !nonSkipGroups.some(({ name }) => name === group.name))
                                      //     .map(group => ({ ...group, skip: true }))
                                      // ]

                                      // console.log('tests', tests)
                                      // console.log('groups', JSON.stringify(groups, null, 2))

                                      const groups = nonSkipGroups.map((group) => ({ ...group, tests: group.tests.filter(({ skip }) => !skip) }))

                                      // console.log('event', event)
                                      
                                      // console.log('REEEEEEEEEEEE',
                                      // _tests
                                      // .filter(test => !nonSkipTests.some(({ name }) => name === test.name))
                                      // .map(test => ({
                                      //   test,
                                      //   function: test.function,
                                      //   status: 'skip',
                                      //   return: undefined,
                                      //   originalStack: undefined,
                                      //   errorStack: undefined
                                      // })))

                                      return (
                                        runInContext({ output })(of({ type: 'run', data: { tests: nonSkipTests, groups } }))
                                          .pipe(
                                            // tap(val => console.log('TESTTTTTTT RAN', val.data)),
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
                                            // tap(val => console.log('TESTTTTTTT', val.data)),
                                          )
                                      )
                                    }),
                                    // tap(val => console.log('val', val)),
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
