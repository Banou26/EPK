import { Worker } from 'worker_threads'

import { Observable, Subject, fromEvent, ReplaySubject, of } from 'rxjs'
import { mergeMap, pluck, map, filter, finalize, shareReplay, publish, withLatestFrom, takeUntil, takeWhile, combineLatest, first } from 'rxjs/operators'

import { cpuCount } from '../utils/cpu'
import { TaskMessage, TASK_STATUS } from '../core/task'
import tap from '../utils/tap'

export default (taskSubject) => {
  const idleWorker =
      Array(cpuCount)
      .fill(undefined)
      .map(() => new Worker('./dist/worker.js'))

    return (
      taskSubject
      |> mergeMap(
        (task, id) => {
          const worker = idleWorker.splice(0, 1)[0]
          const workerMessages = fromEvent(worker, 'message')
          let done = false
          let canceled = false

          return (
            task
            |> tap(message =>
              of(message)
              |> first()
              |> tap(message =>
                worker.postMessage({ id, status: TASK_STATUS.START, ...message })
              )
            )
            |> finalize(() => {
              if (!done) canceled = true
              if (canceled) worker.postMessage({ id, status: TASK_STATUS.CANCEL })
              idleWorker.push(worker)
            })
            |> mergeMap(async message => message) // allow for the finalize to run before the task if it was canceled
            |> filter(() => !canceled) // if it was canceled, filter everything out
            |> tap(message => worker.postMessage({ id, ...message }))
            |> combineLatest(workerMessages, (_, task) => task) // switch the flow from having sent messages to receiving them
            |> tap(({ status }) => status === TASK_STATUS.END && (done = true))
            |> takeWhile(({ status }) => status !== TASK_STATUS.END)
            |> map(message => [id, message])
          )
        },
        cpuCount
      )
    )
}
