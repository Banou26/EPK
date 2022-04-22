import type { Task } from 'src/utils/runtime'
import type { BuildOutput, BuildOutputFile, Group, Test, TestConfig } from '../types'

import { Observable, of } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators'
import { createContext } from '../platforms'


export default ({
  runInContext,
  output,
  build,
  config
}: {
  runInContext: ReturnType<typeof createContext>
  output: BuildOutputFile
  build: BuildOutput
  config: TestConfig
}) =>
  (runTasks: Observable<Task<'run'>>) =>
    runTasks
      .pipe(
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
        })
      )
