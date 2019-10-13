import { Observable, of, generate } from 'rxjs'
import { takeUntil, publish, filter, map, mapTo, switchMap } from 'rxjs/operators'

import Parcel from '../parcel/index.ts'
import { PARCEL_REPORTER_EVENT } from '../parcel/index.ts'
import WorkerFarm from '../workerFarm/index.ts'
import Task, { TASK_TYPE, TASK_STATUS } from './task.ts'
import emit from '../utils/emit.ts'
import AsyncObservable from '../utils/async-observable.ts'

export default (parcelOptions) =>
  AsyncObservable(observer => {
    const workerFarm = WorkerFarm()
    const parcelBundle =
      (Parcel(parcelOptions)
      |> publish())
        .refCount()
  
    const bundle =
      parcelBundle
      |> map(bundle => ({ bundle, parcelOptions }))

    const test =
      bundle
      |> switchMap(bundle =>
        emit({ type: TASK_TYPE.ANALYZE })
        |> workerFarm)

    const result =
      test

    result.subscribe(observer)
  
    return () => {}
  })
