import { Observable, Subject, from, merge, of } from 'rxjs'
import { publish, switchMap, filter, map, tap, takeUntil, mergeMap, shareReplay, share, scan, takeWhile, mergeScan } from 'rxjs/operators'

import './polyfills.ts'
import Parcel from './parcel/index.ts'
import getRuntimeProvider from '../runtimes/index.ts'
import { REPORTER_EVENT, Options, TARGET, BROWSER, RUNTIME, TestFile, TestBundle, RuntimeProvider, Test, TestFileRuntimeAggregation, Runtime } from '../types.ts'
import preprocessor from './preprocessor.ts'
import test from './test.ts'
import analyze from './analyzer.ts'
import { pathToTestUrl, prettifyPath } from '../utils/index.ts'
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
          |> mergeScan(([map], testBundle: TestBundle) => {
            const { parcelBundle } = testBundle
            const childBundles =
              // @ts-ignore
              parcelBundle.isEmpty
                ? Array.from(parcelBundle.childBundles)
                : [parcelBundle]

            const testFiles =
              childBundles.map(({ assets, name: path, entryAsset: { name }}): TestFile => ({
                bundle: testBundle,
                hashes: new Set(
                  Array.from(assets, ({ hash }) => hash)
                ),
                name,
                displayName: prettifyPath(name),
                path,
                url:
                  TARGET.BROWSER === target &&
                  pathToTestUrl(path, options),
                target: runtimeProvider.runtimeName
              }))

            return (
              // @ts-ignore
              of(testBundle)
              // @ts-ignore
              |> map(value => {

                return [acc, value]
              })
              // @ts-ignore
              |> takeUntil(bundle)
            )
          }, [new Map()])
          // @ts-ignore
          |> map(([, value]) => value)
          // @ts-ignore
          |> switchMap((testBundle: TestBundle): Observable<TestFile> => {
            const { parcelBundle } = testBundle
            const childBundles =
              // @ts-ignore
              parcelBundle.isEmpty
                ? Array.from(parcelBundle.childBundles)
                : [parcelBundle]

            const testFiles =
              childBundles.map(({ assets, name: path, entryAsset: { name }}): TestFile => ({
                bundle: testBundle,
                hashes: new Set(
                  Array.from(assets, ({ hash }) => hash)
                ),
                name,
                displayName: prettifyPath(name),
                path,
                url:
                  TARGET.BROWSER === target &&
                  pathToTestUrl(path, options),
                target: runtimeProvider.runtimeName
              }))

            // @ts-ignore
            return from(testFiles)
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
                  displayName: testFile.displayName,
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
