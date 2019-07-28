import { tap } from 'rxjs/operators'


export default () =>
  mergeMap((testFile: TestFile) => {
    // filename
    const { name } = testFile
  
    // todo: load file from on drive cache
    // cached state of this file
    const cachedTestFile =
      testFileCache.get(name) ||
      testFileCache
        .set(name, {...testFile, hashes: new Set()})
        // .set(name, testFile)
        .get(name)
  
    const hashDifference = testFile.hashes.difference(cachedTestFile.hashes)
  
    const updateCache =
      tap((test: Test) => {
        // replace the unexecuted test by the executed one
        const cachedTestFile = testFileCache.get(name)
        cachedTestFile.tests =
          cachedTestFile.tests.map(_test =>
            _test.description === test.description
              ? test
              : _test)
      })
  
    // Get metadata about the needed test files
    const preprocessed =
      // @ts-ignore
      of(testFile)
      // @ts-ignore
      |> filter(() => hashDifference.size || testFile.hashes.size)
      // @ts-ignore
      |> switchMap((testFile: TestFile) =>
        // @ts-ignore
        runtimeProvider
        // @ts-ignore
        |> preprocessor(testFile)
        // @ts-ignore
        |> takeWhile(({ preprocessingEnd }) => !preprocessingEnd, true)
      )
      // @ts-ignore
      |> tap(testFile => testFileCache.set(name, testFile))
      // @ts-ignore
      |> share()
  
    const tested =
      // @ts-ignore
      merge(
        preprocessed
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
      // @ts-ignore
      |> updateCache
      // @ts-ignore
      |> share()
  
    const analyzed =
      // @ts-ignore
      merge(
        tested
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
      // @ts-ignore
      |> updateCache
      // @ts-ignore
      |> share()
  
    // @ts-ignore
    return merge(
      of(hashDifference.size ? testFile : cachedTestFile),
      preprocessed,
      tested,
      analyzed
    )
    // @ts-ignore
    |> map(() => testFileCache.get(name))
  })
