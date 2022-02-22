import type { TestConfig } from '../types'

import { from, merge, of, partition } from 'rxjs'
import { endWith, filter, map, mergeMap, share, switchMap, take, tap } from 'rxjs/operators'
import { SourceMapConsumer } from 'source-map-js'

import esbuild from './esbuild'
import { createContext } from '../platforms'
import { readFile } from 'fs/promises'

export default ({ configs }: { configs: TestConfig[] }) =>
  from(configs)
    .pipe(
      mergeMap((config) => {
        const buildStream = esbuild({ testConfig: config, esbuildOptions: config.esbuild })

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
                
                return (
                  from(build.outputs)
                    .pipe(
                      mergeMap((output) => {
                        const runInContext = createContext({ config, output })
                        const runRegister =
                          of({ type: 'register' })
                            .pipe(
                              runInContext()
                            )
                        const [registerLogsStream, registerStream] = partition(runRegister, (val) => val.type === 'log')
                        const register =
                          registerStream
                            .pipe(
                              filter(({ data: { tests } }) => tests),
                              map(({ data: { tests } }) => tests),
                              // tap(tests => console.log('register done', tests)),
                              take(1),
                              share()
                            )
        
                        const runTest =
                          register
                            .pipe(
                              // tap(tests => console.log('tests', tests)),
                              map(tests => ({
                                type: 'run',
                                data: { tests }
                              })),
                              // tap(tests => console.log('testing done', tests)),
                              runInContext()
                            )
                        const [testLogsStream, testStream] = partition(runTest, (val) => val.type === 'log')
                        const test =
                          testStream
                            .pipe(
                              filter(({ data: { tests } }) => tests),
                              map(({ data: { tests }, ...rest }) => ({ ...rest, testsRuns: tests })),
                              mergeMap(async ({ testsRuns, ...rest }) => ({
                                ...rest,
                                testsRuns:
                                  await Promise.all(testsRuns.map(async testRun => {
                                    if (testRun.status === 'success') return testRun
                                    const sourceMapStr = output.sourcemap.text
                                    const sourceMap = JSON.parse(sourceMapStr)
                                    const sourceMapConsumer = new SourceMapConsumer(sourceMap)
                                    const result = testRun.errorStack.map(stackFrame => ({ ...stackFrame, ...sourceMapConsumer.originalPositionFor({ line: stackFrame.lineNumber, column: stackFrame.columnNumber }) }))
                                    const resultString = result.map(mappedStackFrame => `at ${mappedStackFrame.functionName ?? ''} ${mappedStackFrame.functionName ? '(' : ''}${mappedStackFrame.source || '<anonymous>'}:${mappedStackFrame.line ?? mappedStackFrame.lineNumber ?? 0}:${mappedStackFrame.column ?? mappedStackFrame.columnNumber ?? 0}${mappedStackFrame.functionName ? ')' : ''}`)
                                    const error = {
                                      message: testRun.originalStack.slice(0, testRun.originalStack.indexOf('\n')).replace('Error: ', ''),
                                      stack: `${testRun.originalStack.slice(0, testRun.originalStack.indexOf('\n'))}\n${resultString.slice(0, -3).join('\n')}`.trim()
                                    }
                                    return {
                                      ...testRun,
                                      error
                                    }
                                  }))
                              })),
                              take(1)
                            )
        
                        return (
                          merge(
                            of(build),
                            registerLogsStream,
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
                            }))
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
        )
      })
    )
