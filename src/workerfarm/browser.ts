import { Worker } from 'worker_threads'

import Logger from '@parcel/logger'
import { Observable, Subject, fromEvent, ReplaySubject } from 'rxjs'
import { mergeMap, tap, pluck, map, filter, finalize, shareReplay, publish, withLatestFrom, takeUntil, takeWhile, combineLatest } from 'rxjs/operators'

import { cpuCount } from '../utils/cpu.ts'
import { TaskMessage, TASK_STATUS } from '../core/task.ts'

export default () => {
  const idleWorker =
      Array(cpuCount)
      .fill(undefined)
      .map(() => new Worker('./dist/worker.js'))
  const taskSubject = new Subject()

  const queue =
    taskSubject
    |> mergeMap(
      (task, _, count) => {
        const worker = idleWorker.splice(0, 1)[0]
        const workerMessages = fromEvent(worker, 'message')
        let done = false
        let canceled = false

        worker.postMessage({ status: TASK_STATUS.START })
        return (
          task
          |> finalize(() => {
            if (!done) canceled = true
            if (canceled) worker.postMessage({ status: TASK_STATUS.CANCEL })
            idleWorker.push(worker)
          })
          |> mergeMap(async value => value) // allow for the finalize to run before the task if it was canceled
          |> filter(() => !canceled) // if it was canceled, filter everything out
          |> tap(message => worker.postMessage(message))
          |> combineLatest(workerMessages, (_, message) => message) // switch the flow from having sent messages to receiving them
          |> tap(({ status }) =>
            status === TASK_STATUS.END
              ? (done = true)
              : undefined
          )
          |> takeWhile(({ status }) => status !== TASK_STATUS.END)
          |> map(message => [
            count,
            message
          ])
        )
      },
      cpuCount
    )

  let taskCounter = 0
  return messageObservable => {
    const replay = new ReplaySubject()
    const count = taskCounter
    taskCounter++

    const result =
      (queue
      |> filter(([_count]) => count === _count)
      |> pluck(1))

    result.subscribe(replay)

    taskSubject.next(messageObservable)
    return replay
  }
}
