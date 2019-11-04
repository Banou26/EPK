import { Observable, of, generate, from, BehaviorSubject, zip, combineLatest, merge } from 'rxjs'
import { takeUntil, publish, filter, map, mapTo, switchMap, groupBy, mergeMap, tap, skip, toArray } from 'rxjs/operators'
import browsersList from 'browserslist'

import Parcel from '../parcel/index.ts'
import { PARCEL_REPORTER_EVENT } from '../parcel/index.ts'
import WorkerFarm from '../workerFarm/index.ts'
import Task, { TASK_TYPE, TASK_STATUS } from './task.ts'
import emit from '../utils/emit.ts'
import AsyncObservable from '../utils/async-observable.ts'
import runtimeFactory, { RUNTIMES } from '../runtimes/index.ts'
import preAnalyze from './pre-analyzer.ts'

const getAssetSupportedTargets = asset => [
    ...browsersList(asset.env.engines.browsers)
      |> (arr => arr.map(str =>
        str
          .split(' ')
          .shift()
      ))
      |> (arr => new Set(arr))
      |> (set =>
        Array
          .from(set)
          .filter(runtime => runtime.toUpperCase() in RUNTIMES))
      // todo: add node/electron runtime detection
  ]

export default (parcelOptions) =>
  combineLatest(
    Parcel(parcelOptions),
    runtimeFactory()
  )
  |> switchMap(([bundle, runtime]) =>
    bundle.changedAssets.values()
    |> (values => Array.from(values))
    |> (assets => assets.reduce((arr, asset) => [
      ...arr,
      ...getAssetSupportedTargets(asset)
        .map(target => ({
          asset,
          target
        }))
    ], []))
    |> from
    |> groupBy(
      ({ target }) => target,
      ({ asset }) => asset
    )
    // Observable per target that emit assets
    |> mergeMap(assets =>
      combineLatest(
        assets,
        runtime(assets.key)
      )
      |> mergeMap(([asset, createContext]) => {
        const unisolatedContext = createContext(run => {
          const preAnalyze =
            of({ type: TASK_TYPE.PRE_ANALYZE, url: asset.filePath })
            |> run

          const unisolatedTestsRun =
            preAnalyze
            |> mergeMap(analyze =>
              from(analyze.tests)
              |> filter(({ isolated, async }) => !isolated && !async))
              |> toArray()
            )
            |> map(tests => ({
              type: TASK_TYPE.RUN,
              url: asset.filePath,
              tests
            }))
            |> run

          return merge(
            preAnalyze,
            unisolatedTestsRun
          )
        })


        return merge(
          unisolatedContext
        )
      })
    )
  )

  // |> switchMap(([bundle, run]) =>
  //   of(bundle)
  //   |> mergeMap(({ changedAssets }) =>
  //     changedAssets.values()
  //     |> Array.from
  //     |> from
  //   )
  //   |> map(asset => ({
  //       engines: getAssetSupportedTargets(asset),
  //       asset
  //     })
  //   )
  //   |> mergeMap(({engines, asset}) =>
  //     from(engines)
  //     |> mergeMap(runtime => {
  //       const analyze = run(runtime, { type: TASK_TYPE.PRE_ANALYZE })
  //       return analyze
  //     })
  //   )
  // )

  // AsyncObservable(observer => {
  //   const bundle =
  //     (Parcel(parcelOptions)
  //     |> publish())
  //       .refCount()
  
  //   const analyze =
  //     bundle
  //     |> switchMap(bundle =>
  //       of(bundle)
  //       |> mergeMap(({ changedAssets }) => from(changedAssets.values()))
  //       |> map(asset => ({ asset }))
  //       |> mergeMap(asset =>
  //         of(asset)
  //         |> )
  //       |> groupBy(({ env: { context, engines: { browsers } } }) =>
  //         context === 'browser'
  //           ? ['chrome']
  //           // ? browsersList(browsers)
  //           //   .map(str => str.split(' '))
  //           //   .shift()
  //           : ['node']
  //       )
  //       |> mergeMap(group =>
  //         zip(
  //           of(group.key),
  //           group
  //         )
  //       )
  //       |> mergeMap(([contexts, asset]) =>
  //         from(contexts)
  //         |> map(context => [context, asset])
  //       )
  //       |> mergeMap(([context, asset]) => {
  //         debugger
  //       })
  //     )
  
  //   const analyzeSubscription = analyze.subscribe()
  //   return () => {
  //     analyzeSubscription.unsubscribe()
  //   }
  // })
