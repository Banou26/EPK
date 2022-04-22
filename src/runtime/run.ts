import type { Task } from '../utils/runtime'
import type { Group, GroupRun, Test, TestRun } from '../types'

import { hooks as registeredHooks, groups as registeredGroups, tests as registeredTests } from './test'
import { combineLatest, from, merge, Observable, of } from 'rxjs'
import { endWith, finalize, last, map, mapTo, mergeMap, scan, share, shareReplay, startWith, switchMap, tap } from 'rxjs/operators'

const runTests = (tests: Test<true>[], group?: Group<true>): Observable<TestRun<true>[]> =>
  from(tests)
    .pipe(
      mergeMap(test =>
        group
          ? (
            registeredGroups
              .find(({ name }) => name === group.name)
              .tests
              .filter(({ name }) => group.tests.some(test => name === test.name))
              .find(({ name }) => name === test.name)
              ?.function(undefined) ?? Promise.resolve(undefined)
          )
          : (
            registeredTests
              .find(({ name }) => name === test.name)
              ?.function(undefined) ?? Promise.resolve(undefined)
          )
      ),
      scan((tests, test) => [...tests, test].filter(Boolean), [])
    )

export default ({ groups, tests }: Task<'run', true>['data']) => {
  // register tests inside groups
  registeredGroups.map(group => {
    if (!groups.some(({ name }) => name === group.name)) return
    group.function(...group.useArguments ?? [])
    // console.log('hooks', group.hooks)
  })

  const testsResults =
    runTests(tests)
      .pipe(
        startWith([]),
      )

  const groupsResults =
    from(groups)
      .pipe(
        mergeMap(_group => {
          const group = registeredGroups.find(({ name }) => name === _group.name)
          const setupHooks = group.hooks.filter(({ name }) => name === 'setup')
          const hooksResolved = Promise.all(setupHooks.map(async (hook) => ({ hook, result: await hook.function() })))
          return from(hooksResolved).pipe(map(hooks => ({ group: _group, hooks })))
        }),
        mergeMap(({ group, hooks }) => {
          return (
            runTests(
              registeredGroups
                .find(({ name }) => name === group.name)
                .tests,
              group
            )
              .pipe(
                scan((group, tests) => ({ ...group, tests }), { ...group, tests: [] }),
                finalize(() => {
                  hooks.filter(({ hook, result }) => hook.name === 'setup' && typeof result === 'function').map(({ result }) => result())
                  hooks.filter(({ hook }) => hook.name === 'teardown').map(({ hook }) => hook.function())
                })
              )
          )
        }),
        scan((groups: GroupRun<true>[], group: GroupRun<true>) => [...groups.filter(({ name }) => name !== group.name), group], []),
        startWith([])
      )

  const combined =
    combineLatest([testsResults, groupsResults])
      .pipe(
        map(([tests, groups]) => ({
          type: 'run',
          data: {
            tests,
            groups
          }
        })),
        shareReplay()
      )

  const endResult =
    combined.pipe(
      last(),
      map(event => ({
        ...event,
        data: {
          ...event.data,
          done: true
        }
      }))
    )

  return merge(combined, endResult)
}
