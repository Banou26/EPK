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
          target,
          bundle
        }))
    ], []))
    |> from
    |> groupBy(
      ({ target }) => target,
      ({ bundle, asset }) => ({ bundle, asset })
    )
    // Observable per target that emit assets
    |> mergeMap((assets) =>
      combineLatest(
        assets,
        runtime(assets.key) |> from
      )
      |> mergeMap(([{ bundle, asset }, createContext]) => {
        const unisolatedContext = createContext({ url: asset.filePath },run => {
          const preAnalyze =
            of({ type: TASK_TYPE.PRE_ANALYZE, url: asset.filePath })
            |> run

          const tests =
            preAnalyze
            |> mergeMap(analyze =>
              from(analyze.tests)
              |> filter(({ isolated, async }) => !isolated && !async)
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
            tests
          )
        })



        return merge(
          unisolatedContext
        )
      })
    )
  )
