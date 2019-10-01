import { Subject, Observable } from 'rxjs'

import { cpuCount } from '../utils/cpu.ts'
import Task from './task.ts'
import Worker from './worker.ts'

export default ({ web = false }) => {
  const workerSubjects =
    Array(cpuCount)
      .fill(undefined)
      .map(() => new Subject())

  const workers = new Set(
    Array(cpuCount)
      .fill(undefined)
      .map((_, i) =>
        workerSubjects[i]
        |> Worker({ web }))
  )

  const workerTasks = Array(cpuCount).fill(undefined)

  const taskQueue = new Set()

  const assignTasks = () => {
    if (!taskQueue.size) return
    for (const i in workerTasks) {
      const task = workerTasks[i]
      if (task === undefined) {
        const waitingTask = taskQueue.values().next()

        workerTasks.splice(i, 1, waitingTask)
        taskQueue.remove(waitingTask)

        waitingTask.subscribe(
          undefined,
          undefined,
          () => workerTasks.splice(i, 1, undefined)
        )

        workerSubjects[i].next(waitingTask)
      }
      if (!taskQueue.size) return
    }
  }

  return () => new Observable(observer => {
    taskQueue.add(task)
    assignTasks()
    return () => {
      taskQueue.remove(task)
      assignTasks()
    }
  })

  // return {
  //   add: (task: Task) => {
  //     taskQueue.add(task)
  //     assignTasks()
  //   },
  //   remove: (task: Task) => {
  //     taskQueue.remove(task)
  //     assignTasks()
  //   }
  // }
}
