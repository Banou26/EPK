import { OperatorFunction } from 'rxjs'
import { mergeMap, take, filter, pluck, startWith, takeUntil, scan, combineLatest, map, skip } from 'rxjs/operators'

import {
  MESSAGE,
  Test,
  Runtime,
} from '../types.ts'
import { Observable as AsyncObservable } from '../utils/index.ts'


export default (testFile, test: Test): OperatorFunction<Runtime, Test> =>
  mergeMap(({ loadFile, inMessages, outMessages }: Runtime) =>
    AsyncObservable<Test>(async observer => {
      await loadFile(testFile)

      const tests =
        // @ts-ignore
        inMessages
        // @ts-ignore
        |> filter(({ type }) => type === MESSAGE.RUN_TEST_RESPONSE)
        // @ts-ignore
        |> pluck('test')
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
        |> map(([_test, logs]): Test => ({
          description: test.description,
          body: test.body,
          type: _test?.type,
          value: _test?.value,
          logs: logs,
          executionStart: _test?.executionStart,
          executionEnd: _test?.executionEnd
        }))

      // @ts-ignore
      result.subscribe(
        test => observer.next(test),
        err => observer.error(err),
        () => observer.complete()
      )

      outMessages.next({ type: MESSAGE.RUN_TEST, description: test.description })
    }))
