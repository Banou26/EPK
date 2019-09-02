import { Observable, Subject, from, merge } from 'rxjs'
import { publish, switchMap, filter, map, tap, takeUntil, mergeMap, shareReplay, publishReplay } from 'rxjs/operators'

import './polyfills.ts'
import { REPORTER_EVENT, Options, TARGET, RUNTIME } from '../types.ts'
import Parcel from './parcel/index.ts'
import getRuntimeProvider from '../runtimes/index.ts'
import manageRuntimes from './runtime-manager.ts'


export default
  options => {

    const parcelBundle =
      // @ts-ignore
      (Parcel(options)
        // @ts-ignore
        |> publish())
        // @ts-ignore
        .refCount()

    const build =
      parcelBundle
      // @ts-ignore
      |> filter(({ name }) => name === 'buildStart')

    const buildStart =
      build
      // @ts-ignore
      |> mapTo({ type: REPORTER_EVENT.BUILD_START })

    const bundle =
      build
      // @ts-ignore
      |> switchMap(({ entryFiles, buildStartTime }) =>
        // @ts-ignore
        parcelBundle
        // @ts-ignore
        |> filter(({ name }) => name === 'bundled')
        // @ts-ignore
        |> map(bundle => ({ ...bundle, entryFiles, buildStartTime })))

    const buildSuccess =
      parcelBundle
      // @ts-ignore
      |> mapTo({ type: REPORTER_EVENT.BUILD_SUCCESS })

    const tests = manageRuntimes({
      target, bundle, runtimeProvider, options
    })

    return merge(
      buildStart,
      buildSuccess
    )
    
    // const bundle =
    //   // @ts-ignore
    //   parcelBundle
    //   // @ts-ignore
    //   |> filter(({ name }) => name === 'buildStart')
    //   // @ts-ignore
    //   |> tap(() => observer.next({ type: REPORTER_EVENT.BUILD_START }))
    //   // @ts-ignore
    //   |> switchMap(({ entryFiles, buildStartTime }) =>
    //     // @ts-ignore
    //     parcelBundle
    //     // @ts-ignore
    //     |> filter(({ name }) => name === 'bundled')
    //     // @ts-ignore
    //     |> tap(() => observer.next({ type: REPORTER_EVENT.BUILD_SUCCESS }))
    //     // @ts-ignore
    //     |> map(bundle => ({ ...bundle, entryFiles, buildStartTime })))
    //   // @ts-ignore
    //   |> shareReplay(1) // needed for slow runtimes to start working on initial bundle

    // return (

    // )
  }


// export default
//   (options: Options) => {
//     const { watch, target = TARGET.BROWSER, entryFiles, port, outDir = '.epk' } = options

//     const runtimeNames =
//       options.target === TARGET.NODE
//         ? [RUNTIME.NODE]
//         : options.browsers as unknown as RUNTIME[] || [RUNTIME.CHROME]

//     const parcelBundle =
//         // @ts-ignore
//         (Parcel({
//           entryFiles: entryFiles,
//           target: target,
//           outDir: `${outDir}/dist/${target}`,
//           watch: true,
//           cache: true,
//           cacheDir: `${outDir}/cache/${target}`
//         })
//         // @ts-ignore
//         |> publish())
//           // @ts-ignore
//           .refCount()

//     return (
//       parcelBundle
//         // @ts-ignore
//         |> filter(({ name }) => name === 'buildStart')
//         // @ts-ignore
//         |> tap(() => observer.next({ type: REPORTER_EVENT.BUILD_START }))
//         // @ts-ignore
//         |> switchMap(({ entryFiles, buildStartTime }) =>
//           // @ts-ignore
//           parcelBundle
//           // @ts-ignore
//           |> filter(({ name }) => name === 'bundled')
//           // @ts-ignore
//           |> tap(() => observer.next({ type: REPORTER_EVENT.BUILD_SUCCESS }))
//           // @ts-ignore
//           |> map(bundle => ({ ...bundle, entryFiles, buildStartTime })))
//         // @ts-ignore
//         |> publishReplay(1) // needed for slow runtimes to start working on initial bundle
//     // @ts-ignore
//   }




    // Observable.create(observer => {
    //   const { watch, target = TARGET.BROWSER, entryFiles, port, outDir = '.epk' } = options

    //   const unsubscribe = new Subject()

    //   const parcelBundle =
    //     // @ts-ignore
    //     (Parcel({
    //       entryFiles: entryFiles,
    //       target: target,
    //       outDir: `${outDir}/dist/${target}`,
    //       watch: true,
    //       cache: true,
    //       cacheDir: `${outDir}/cache/${target}`
    //     })
    //     // @ts-ignore
    //     |> takeUntil(unsubscribe)
    //     // @ts-ignore
    //     |> publish())
    //       // @ts-ignore
    //       .refCount()

    //   // @ts-ignore
    //   const bundle =
    //     // @ts-ignore
    //     parcelBundle
    //     // @ts-ignore
    //     |> filter(({ name }) => name === 'buildStart')
    //     // @ts-ignore
    //     |> tap(() => observer.next({ type: REPORTER_EVENT.BUILD_START }))
    //     // @ts-ignore
    //     |> switchMap(({ entryFiles, buildStartTime }) =>
    //       // @ts-ignore
    //       parcelBundle
    //       // @ts-ignore
    //       |> filter(({ name }) => name === 'bundled')
    //       // @ts-ignore
    //       |> tap(() => observer.next({ type: REPORTER_EVENT.BUILD_SUCCESS }))
    //       // @ts-ignore
    //       |> map(bundle => ({ ...bundle, entryFiles, buildStartTime })))
    //     // @ts-ignore
    //     |> shareReplay(1) // needed for slow runtimes to start working on initial bundle

    //   const runtimeNames =
    //     options.target === TARGET.NODE
    //       ? [RUNTIME.NODE]
    //       : options.browsers as unknown as RUNTIME[] || [RUNTIME.CHROME]

    //   const runtimeProvider =
    //     // @ts-ignore
    //     from(runtimeNames, runtimeName => getRuntimeProvider(runtimeName))
    //     // @ts-ignore
    //     |> mergeMap(makeRuntimeProvider => makeRuntimeProvider(options))
    //     // @ts-ignore
    //     |> takeUntil(unsubscribe)

    //   const tests = manageRuntimes({
    //     target,
    //     bundle,
    //     runtimeProvider,
    //     options
    //   })

    //   // @ts-ignore
    //   tests.subscribe(
    //     value => observer.next(value),
    //     error => observer.error(error),
    //     () => observer.complete()
    //   )

    //   return () => {
    //     unsubscribe.next()
    //     unsubscribe.complete()
    //   }
    // })
