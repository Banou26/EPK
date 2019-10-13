import { parentPort } from 'worker_threads'

import { TASK_STATUS, TASK_TYPE } from '../core/task.ts'
import { fromEvent, of, Subject } from 'rxjs'
import { tap, shareReplay, first, filter, switchMap, groupBy, mergeMap, finalize } from 'rxjs/operators'

import analyze from './analyzer.ts'
import preAnalyze from './pre-analyzer.ts'
import run from './runner.ts'

const taskMap = new Map([
  [TASK_TYPE.ANALYZE, analyze],
  [TASK_TYPE.PRE_ANALYZE, preAnalyze],
  [TASK_TYPE.RUN, run]
])

const runTask = messages => {
  const replay = messages |> shareReplay()

  return (
    replay
    |> first()
    |> switchMap(({ id, type }) =>
      taskMap.get(type)(replay)
      |> finalize(() => parentPort.postMessage({ id, status: TASK_STATUS.END }))
    )
    |> tap(message => parentPort.postMessage(message))
  )
}

export default runTask

if (parentPort) {
  const tasks =
    fromEvent(parentPort, 'message')
    |> groupBy(({ id }) => id)
    |> mergeMap(runTask)

  tasks.subscribe()
}
