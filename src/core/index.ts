import { Observable, of, generate, from, BehaviorSubject, zip, combineLatest } from 'rxjs'
import { takeUntil, publish, filter, map, mapTo, switchMap, groupBy, mergeMap, tap, skip, toArray } from 'rxjs/operators'
import browsersList from 'browserslist'

import Parcel from '../parcel/index.ts'
import { PARCEL_REPORTER_EVENT } from '../parcel/index.ts'
import WorkerFarm from '../workerFarm/index.ts'
import Task, { TASK_TYPE, TASK_STATUS } from './task.ts'
import emit from '../utils/emit.ts'
import AsyncObservable from '../utils/async-observable.ts'
import taskRunner from '../runtimes/index.ts'
import preAnalyze from './pre-analyzer.ts'
import { TASK_TYPE } from './task.ts'

export default (parcelOptions) =>
  combineLatest(
    Parcel(parcelOptions),
    runtimeFactory()
  )
  |> switchMap((bundle, Runtime) =>
    bundle
    |> mergeMap(({ changedAssets }) => from(changedAssets.values()))
    |> map(asset => ({
        engines: [
          ...browsersList(asset.env.engines.browsers)
            .map(str =>
              str
                .split(' ')
                .shift()
            )
        ],
        asset
      })
    )
    |> mergeMap(({engines, asset}) =>
      from(engines)
      |> mergeMap(runtime =>
        run(runtime, { type: TASK_TYPE.PRE_ANALYZE }))
    )
  )

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
