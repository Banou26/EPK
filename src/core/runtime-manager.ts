import { prettifyPath, pathToTestUrl } from '../utils/file.ts';
import { TARGET, TestFile, RUNTIME, TestFileRuntimeAggregation, REPORTER_EVENT } from '../types.ts';
import { Subject } from 'rxjs';

export default ({ target, bundle, runtimeProvider, options }) =>
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

      const testFilesMap =
        new Map(
          childBundles
            .map(({ assets, name: path, entryAsset: { name }}): TestFile => ({
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
            .map(testFile => [
              testFile.name,
              testFile
            ])
        )

      for (const [path, testFile] of testFilesMap) {
        if (!map.has(path)) {
          map.set(path, {
            unsubscribe: new Subject()
          })
        }
      }

      for (const [path, testFile] of map) {
        if (!testFilesMap.has(path)) {
          map.get(path).unsubscribe.next()
          map.get(path).unsubscribe.complete()
          map.delete(path)
        }
      }

      return (
        // @ts-ignore
        of(testBundle)
        // @ts-ignore
        |> map(value => {
          // const processing = process()
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