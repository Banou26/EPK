import { tap } from 'rxjs/operators'

import Parcel from './parcel.ts'

import { PARCEL_REPORTER_EVENT } from '../parcel/index.ts'
import WorkerFarm from '../workerFarm/index.ts'
import Task, { TASK_TYPE, TASK_STATUS } from './task.ts'
import emit from '../utils/emit.ts'
import AsyncObservable from '../utils/async-observable.ts'
import runtimeFactory, { RUNTIMES } from '../runtimes/index.ts'
import preAnalyze from './pre-analyzer.ts'
