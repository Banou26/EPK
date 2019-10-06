import { Observable, of } from 'rxjs'
import { takeUntil, publish, filter, map, mapTo, switchMap } from 'rxjs/operators'

import Parcel from '../parcel/index.ts'
import { PARCEL_REPORTER_EVENT } from '../parcel/index.ts'
import WorkerFarm from './workerFarm.ts'
import Task, { TASK_TYPE, TASK_STATUS } from './task.ts'
import AsyncObservable from '../utils/async-observable.ts'

export default (parcelOptions) =>
  AsyncObservable(observer => {
    const workerFarm = WorkerFarm()
    const parcelBundle =
      (Parcel(parcelOptions)
      |> publish())
        .refCount()
  
    const build =
      parcelBundle
      |> filter(({ name }) => name === PARCEL_REPORTER_EVENT.BUILD_START)
  
    const bundle =
      parcelBundle

    // const bundle =
    //   build
    //   |> switchMap(({ entryFiles, buildStartTime }) =>
    //     parcelBundle
    //     |> filter(({ name }) => name === PARCEL_REPORTER_EVENT.BUILD_SUCCESS)
    //     |> map(bundle => ({ ...bundle, entryFiles, buildStartTime })))
  
    const test =
      bundle
      |> switchMap(bundle =>
        of({ type: TASK_TYPE.ANALYZE })
        |> workerFarm)

    const result =
      test

    result.subscribe(observer)
  
    return () => {}
  })
