import { Observable } from 'rxjs'
import { cpuCount } from '../utils/cpu.ts'
import Worker from './worker.ts'
import { TaskMessage } from './task.ts'

export default () => {
  const idleWorker =
      Array(cpuCount)
      .fill(undefined)
      .map(() => Worker('./worker.js'))
  return (task: Observable<TaskMessage>) =>
    task
    |> mergeMap(taskMessage => {
      const worker = idleWorker.splice(0, 1)
      port2.postMessage(task)
      port1.on('message', (message) => console.log('received', message))
      return worker
      idleWorker.push(worker)
    }, cpuCount)
}
