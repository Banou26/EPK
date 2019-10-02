import { Observable, Subject, fromEvent } from 'rxjs'
import { cpuCount } from '../utils/cpu.ts'
import { Worker } from 'worker_threads'
// import Worker from './worker.ts'
import { TaskMessage, TASK_STATUS } from './task.ts'
import { mergeMap, tap, pluck, map, filter, finalize } from 'rxjs/operators'

export default () => {
  const idleWorker =
      Array(cpuCount)
      .fill(undefined)
      .map(() => new Worker('./dist/worker.js'))
  const taskSubject = new Subject<TaskMessage>()

  const queue =
    taskSubject
    |> mergeMap(
      (task, _, count) => {
        const worker = idleWorker.splice(0, 1)
        const workerMessages = fromEvent(worker, 'message')

        worker.postMessage({ status: TASK_STATUS.START })
        return (
          task
          |> finalize(() => worker.postMessage({ status: TASK_STATUS.CANCEL })) // clean up the worker
          |> tap(message => worker.postMessage(message))
          |> withLatestFrom(workerMessages) // switch the flow from having sent messages to receiving them
          |> pluck(1) // from here we only have messages from the worker
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
    const count = taskCounter
    taskCounter++

    return (
      queue
      |> filter(([_count]) => count === _count)
      |> pluck(1)
    )
  }
}
