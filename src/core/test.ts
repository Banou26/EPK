import { from, OperatorFunction } from 'rxjs'
import { switchMap, mergeMap, take } from 'rxjs/operators'

import {
  TargetRuntime,
  MESSAGE,
  Test,
  EPK_FUNCTION_PROPERTY_PLACEHOLDER,
  BROWSER,
  AnalyzedTestFile,
  TestResult,
  RuntimeProvider,
  Runtime,
  TestFile
} from '../types.ts'
import { parse, Observable as AsyncObservable } from '../utils/index.ts'


export default (test: Test): OperatorFunction<Runtime, TestResult> =>
  mergeMap(({ loadFile, inMessages, outMessages }: Runtime) =>
    AsyncObservable<TestResult>(async observer => {
      await loadFile(test.testFile)

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
        |> map(([testResult, logs]): TestResult => ({
          parcelBundle: test.parcelBundle,
          bundle: test.bundle,
          analyzedTestFile: test.analyzedTestFile,
          test,
          type: testResult?.type,
          value: testResult?.value,
          logs: logs,
          timeStart: testResult?.timeStart,
          timeEnd: testResult?.timeEnd
        }))

      // @ts-ignore
      result.subscribe(
        testResult => observer.next(testResult),
        err => observer.error(err),
        () => observer.complete()
      )

      outMessages.next({ type: MESSAGE.RUN_TEST, description: test.description })
    }))
