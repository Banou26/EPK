import type { Task } from '../utils/runtime'
import type { Describe, DescribeRun, Test, TestRun } from '../types'

import { describes as registeredDescribes, tests as registeredTests } from './test'
import { combineLatest, from, merge, Observable, of } from 'rxjs'
import { endWith, finalize, last, map, mergeMap, scan, share, shareReplay, startWith, switchMap, tap } from 'rxjs/operators'

const runTests = (tests: Test<true>[], describe?: Describe<true>): Observable<TestRun<true>[]> =>
  from(tests)
    .pipe(
      mergeMap(test =>
        describe
          ? (
            registeredDescribes
              .find(({ name }) => name === describe.name)
              .tests
              .find(({ name }) => name === test.name)
              .function(undefined)
          )
          : (
            registeredTests
              .find(({ name }) => name === test.name)
              .function(undefined)
          )
      ),
      scan((tests, test) => [...tests, test], [])
    )

export default ({ describes, tests }: Task<'run'>['data']) => {
  // register tests inside describes
  registeredDescribes.map(describe => {
    if (!describes.some(({ name }) => name === describe.name)) return
    describe.function(...describe.useArguments)
  })

  const testsResults =
    runTests(tests)
      .pipe(
        startWith([]),
      )

  const describesResults =
    from(describes)
      .pipe(
        mergeMap(describe =>
          runTests(
            registeredDescribes
              .find(({ name }) => name === describe.name)
              .tests,
            describe
          )
            .pipe(
              scan((describe, tests) => ({ ...describe, tests }), { ...describe, tests: [] })
            )
        ),
        scan((describes: DescribeRun<true>[], describe: DescribeRun<true>) => [...describes.filter(({ name }) => name !== describe.name), describe], []),
        startWith([])
      )

  const combined =
    combineLatest([testsResults, describesResults])
      .pipe(
        map(([tests, describes]) => ({
          type: 'run',
          data: {
            tests,
            describes
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
