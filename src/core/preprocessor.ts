import { performance } from 'perf_hooks'

import { OperatorFunction } from 'rxjs'
import {
  map,
  scan,
  skip,
  take,
  pluck,
  filter,
  mergeMap,
  startWith,
  takeUntil,
  combineLatest,
} from 'rxjs/operators'

import { MESSAGE, TestFile, Runtime } from '../types.ts'
import { Observable as AsyncObservable } from '../utils/index.ts'

export default (testFile: TestFile): OperatorFunction<Runtime, TestFile> =>
  mergeMap(({ loadFile, inMessages, outMessages }: Runtime) =>
    AsyncObservable<TestFile>(async observer => {
      const preprocessingStart = performance.now()
      await loadFile(testFile)

      const tests =
        // @ts-ignore
        inMessages
        // @ts-ignore
        |> filter(({ type }) => type === MESSAGE.GET_TESTS_RESPONSE)
        // @ts-ignore
        |> pluck('tests')
        // @ts-ignore
        |> take(1)
        // @ts-ignore
        |> startWith(undefined)

      const logs =
        // @ts-ignore
        inMessages
        // @ts-ignore
        |> takeUntil(tests |> skip(1))
        // @ts-ignore
        |> filter(({ type }) => type === MESSAGE.LOG)
        // @ts-ignore
        |> pluck('log')
        // @ts-ignore
        |> scan((arr, log) => [...arr, log] , [])
        // @ts-ignore
        |> startWith([])

      const result =
        tests
        // @ts-ignore
        |> take(2)
        // @ts-ignore
        |> combineLatest(logs)
        // @ts-ignore
        |> map(([tests, logs]): TestFile => ({
          bundle: testFile.bundle,
          tests,
          logs,
          preprocessingStart,
          preprocessingEnd: tests && performance.now()
        }))

      // @ts-ignore
      result.subscribe(
        analyzedTestFile => observer.next(analyzedTestFile),
        err => observer.error(err),
        () => observer.complete()
      )

      outMessages.next({ type: MESSAGE.GET_TESTS })
    })
  )
