import { Observable, Subject, from } from 'rxjs'
import { publish, switchMap, filter, map, tap, takeUntil, mergeMap, shareReplay } from 'rxjs/operators'

import './polyfills.ts'
import { REPORTER_EVENT, Options, TARGET, RUNTIME } from '../types.ts'
import Parcel from './parcel/index.ts'
import getRuntimeProvider from '../runtimes/index.ts'
import process from './processor.ts'

export default
  (options: Options) =>
    Observable.create(observer => {
      const { watch, target = TARGET.BROWSER, entryFiles, port, outDir = '.epk' } = options

      const unsubscribe = new Subject()

      const parcelBundle =
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
        parcelBundle
        // @ts-ignore
        |> filter(({ name }) => name === 'buildStart')
        // @ts-ignore
        |> tap(() => observer.next({ type: REPORTER_EVENT.BUILD_START }))
        // @ts-ignore
        |> switchMap(({ entryFiles, buildStartTime }) =>
          // @ts-ignore
          parcelBundle
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

      // @ts-ignore
      const tests = process({
        bundle,
        runtimeProvider
      })

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
