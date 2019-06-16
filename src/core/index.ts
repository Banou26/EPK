import { Observable, Subject, from, merge, of } from 'rxjs'
import { publish, switchMap, filter, map, tap, takeUntil, mergeMap, shareReplay, share, scan, takeWhile } from 'rxjs/operators'

import './polyfills.ts'
import Parcel from './parcel/index.ts'
import getRuntimeProvider from '../runtimes/index.ts'
import { REPORTER_EVENT, Options, TARGET, BROWSER, RUNTIME, TestFile, TestBundle, RuntimeProvider, Test, TestFileRuntimeAggregation, Runtime } from '../types.ts'
import preprocessor from './preprocessor.ts'
import test from './test.ts'
import analyze from './analyzer.ts'
import { pathToTestUrl } from '../utils/index.ts'
import { string } from 'prop-types';

export default
  (options: Options) =>
    Observable.create(observer => {
      const { watch, target = TARGET.BROWSER, entryFiles, port, outDir = '.epk' } = options

      const unsubscribe = new Subject()

      const parcel =
        // @ts-ignore
        (Parcel({
          entryFiles: entryFiles,
          target: target,
          outDir: `${outDir}/dist/${target}`,
          watch: true,
          cache: true,
          cacheDir: `${outDir}/cache/${target}`
        })
        // @ts-ignore
        |> takeUntil(unsubscribe)
        // @ts-ignore
        |> publish())
          // @ts-ignore
          .refCount()

      // @ts-ignore
      const bundle =
        // @ts-ignore
        parcel
        // @ts-ignore
        |> filter(({ name }) => name === 'buildStart')
        // @ts-ignore
        |> tap(() => observer.next({ type: REPORTER_EVENT.BUILD_START }))
        // @ts-ignore
        |> switchMap(({ entryFiles, buildStartTime }) =>
          // @ts-ignore
          parcel
          // @ts-ignore
          |> filter(({ name }) => name === 'bundled')
          // @ts-ignore
          |> tap(() => observer.next({ type: REPORTER_EVENT.BUILD_SUCCESS }))
          // @ts-ignore
          |> map(bundle => ({ ...bundle, entryFiles, buildStartTime })))
        // @ts-ignore
        |> shareReplay(1) // needed for slow runtimes to start working on initial bundle

      const runtimeNames =
        options.target === TARGET.NODE
          ? [RUNTIME.NODE]
          : options.browsers as unknown as RUNTIME[] || [RUNTIME.CHROME]

      const runtimeProvider =
        // @ts-ignore
        from(
          runtimeNames
            .map(runtimeName => getRuntimeProvider(runtimeName))
            .map(makeRuntimeProvider => makeRuntimeProvider(options)))
        // @ts-ignore
        |> mergeMap(runtimeProvider => runtimeProvider) // todo: check how to remove that
        // @ts-ignore
        |> takeUntil(unsubscribe)

      const testFileCache = new Map<string, TestFile>()

      // @ts-ignore
      const tests =
        // @ts-ignore
        runtimeProvider
        // @ts-ignore
        |> mergeMap((runtimeProvider: RuntimeProvider) =>
          bundle
          // @ts-ignore
          |> switchMap((testBundle: TestBundle): Observable<TestFile> => {
            const { parcelBundle } = testBundle
            const childBundles =
              // @ts-ignore
              parcelBundle.isEmpty
                ? Array.from(parcelBundle.childBundles)
                : [parcelBundle]

            const testFiles =
              childBundles.map(({ name: path, entryAsset: { name }}): TestFile => ({
                bundle: testBundle,
                hashes: new Set(
                  Array.from(
                    testBundle.parcelBundle.assets,
                    asset => asset.hash
                  )
                ),
                name,
                path,
                url:
                  TARGET.BROWSER === target &&
                  pathToTestUrl(path, options),
                target: runtimeProvider.runtimeName
              }))

            // @ts-ignore
            return from(testFiles)
              // @ts-ignore
              |> mergeMap((testFile: TestFile) => {
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
                  |> filter(() => hashDifference.size)
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
                    |> filter(() => !hashDifference.size)
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
      
                // const analyzed =
                //   // @ts-ignore
                //   merge(
                //     tested,
                //     // @ts-ignore
                //     of(cachedTestFile)
                //     // @ts-ignore
                //     |> filter(() => !hashDifference.size)
                //     // @ts-ignore
                //     |> mergeMap(({ tests }) => from(tests))
                //   )
                //   // @ts-ignore
                //   |> mergeMap((test: Test) =>
                //     // test hasn't changed and is in the cache
                //     (!hashDifference.size &&
                //       cachedTestFile.tests.find((test) =>
                //         test.description === _test.description &&
                //         'analyzeEnd' in test)) ||
                //     // @ts-ignore
                //     runtimeProvider
                //     // @ts-ignore
                //     |> analyze(test)
                //     // @ts-ignore
                //     |> takeWhile(({ analyzeEnd }) => !analyzeEnd, true)
                //   )
                //   // @ts-ignore
                //   |> updateCache

                // @ts-ignore
                return merge(
                  of(hashDifference.size ? testFile : cachedTestFile),
                  preprocessed,
                  tested,
                  // analyzed
                )
                // @ts-ignore
                |> map(() => testFileCache.get(name))
              })
              // @ts-ignore
              |> scan(
                (testFiles, testFile: TestFile) => testFiles.set(testFile.name, testFile),
                new Map<string, TestFile>()
              )
              // @ts-ignore
              |> map(testFiles => [
                runtimeProvider.runtimeName,
                testFiles
              ])
          })
        )
        // @ts-ignore
        |> scan(
          (runtimes, [runtime, fileTests]) =>
            runtimes.set(runtime, fileTests),
          new Map<RUNTIME,Map<string, TestFile>>()
        )
        // @ts-ignore
        |> map((runtimes: Map<RUNTIME,Map<string, TestFile>>) =>
          Array.from(runtimes).reduce((aggregations, [runtime, testFiles]) => {

            for (const testFile of testFiles.values()) {
              if (!aggregations.has(testFile.name)) {
                aggregations.set(testFile.name, {
                  bundle: testFile.bundle,
                  hashes: testFile.hashes,
                  name: testFile.name,
                  path: testFile.path,
                  url: testFile.url,
                  tests: testFile.tests,
                  testFiles: new Map<RUNTIME, TestFile>()
                })
              }
              aggregations.get(testFile.name).testFiles.set(runtime, testFile)
            }
            return aggregations
          }, new Map<string, TestFileRuntimeAggregation>())
        )
        // @ts-ignore
        |> map(testFiles => ({
          type: REPORTER_EVENT.STATE,
          testFiles
        }))

      // @ts-ignore
      tests.subscribe(
        value => observer.next(value),
        error => observer.error(error),
        () => observer.complete()
      )

      return () => {
        unsubscribe.next()
        unsubscribe.complete()
      }
    })
