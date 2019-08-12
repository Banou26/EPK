import { mergeScan, map, takeUntil } from 'rxjs/operators'
import { of, merge } from 'rxjs'

import { TestFile, Test, Log } from '../types.ts'
import preprocessTestFile from './preprocessor.ts'
import runTest from './runner.ts'
import analyzeTests from './analyzer.ts'

interface Cache {
  hashes: Set<string>
  tests: Test,
  testsDone: boolean
  logs: Log[]
  preprocessingStart: boolean
  preprocessingEnd: boolean
}

export default
  unsubscribe =>
    // @ts-ignore
    mergeScan<unknown, [Partial<Cache>, TestFile?]>(([cache], testFile: TestFile) => {
      const { hashes: cachedHashes } = cache
      const { hashes } = cache

      // @ts-ignore
      const hashDifference = cachedHashes.difference(hashes)
      const hasChanged =
        hashDifference.size
        || hashes.size

      const preprocessedTestFile =
        // @ts-ignore
        of(testFile)
        // @ts-ignore
        |> filter(() => hasChanged)
        // @ts-ignore
        |> switchMap(() =>
          // @ts-ignore
          runtimeProvider
          // @ts-ignore
          |> preprocessTestFile(testFile)
          // @ts-ignore
          |> takeWhile(({ preprocessingEnd }) => !preprocessingEnd, true)
        )
        // @ts-ignore
        |> tap(({ tests, logs, preprocessingStart, preprocessingEnd }) => {
          cache.tests = tests
          cache.testsDone = false
          cache.logs = logs
          cache.preprocessingStart = preprocessingStart
          cache.preprocessingEnd = preprocessingEnd
        })
        // @ts-ignore
        |> share()

      const testResult =
        // @ts-ignore
        merge(
          preprocessedTestFile
          // @ts-ignore
          |> filter(({ preprocessingEnd }) => preprocessingEnd),
          // @ts-ignore
          of(cachedTestFile)
          // @ts-ignore
          |> filter(() => !hashDifference.size && testFile.hashes.size)
        )
        // @ts-ignore
        |> switchMap((testFile: TestFile) =>
          // @ts-ignore
          from(testFile.tests)
          // @ts-ignore
          |> mergeMap((test: Test) =>
            // test hasn't changed and is in the cache
            (!hashDifference.size &&
            cachedTestFile.tests.find((_test) =>
              test.description === _test.description &&
              'executionEnd' in _test)) ||
            // test has changed or wasn't in the cache
            // @ts-ignore
            runtimeProvider
            // @ts-ignore
            |> run(testFile, test)
            // @ts-ignore
            |> takeWhile(({ executionEnd }) => !executionEnd, true)
          )
        )
        // @ts-ignore
        |> updateCache
        // @ts-ignore
        |> share()
    
      const analyzedTest =
        // @ts-ignore
        merge(
          testResult
          // @ts-ignore
          |> filter(({ preprocessEnd }) => preprocessEnd),
          // @ts-ignore
          of(cachedTestFile)
          // @ts-ignore
          |> filter(() => !hashDifference.size && testFile.hashes.size)
        )
        // @ts-ignore
        |> switchMap((testFile: TestFile) =>
          // @ts-ignore
          from(testFile.tests)
          // @ts-ignore
          |> mergeMap((_test: Test) =>
            // test hasn't changed and is in the cache
            (!hashDifference.size &&
            cachedTestFile.tests.find((test) =>
              test.description === _test.description &&
              'executionEnd' in test)) ||
            // test has changed or wasn't in the cache
            // @ts-ignore
            runtimeProvider
            // @ts-ignore
            |> test(testFile, _test)
            // @ts-ignore
            |> takeWhile(({ executionEnd }) => !executionEnd, true)
          )
        )

      const mergedResult = merge(
        preprocessedTestFile,
        testResult,
        analyzedTest
      )

      return (
        // @ts-ignore
        mergedResult
        // @ts-ignore
        |> map(result => [cache, result])
        // @ts-ignore
        |> takeUntil(unsubscribe)
      )
    }, [{}])
    // @ts-ignore
    |> map(([, result]) => result)
