import { of, Subject } from 'rxjs'
import { finalize, filter } from 'rxjs/operators'

import chrome from './chrome.ts'

const runtimeMap = new Map([
  ['chrome', chrome]
])

export default options => {
  const runtimeSubjects = new Map()
  const runtimes = new Map()

  return of(
    async (runtimeName, task) => {
      if (!runtimes.has(runtimeName)) {
        const subject = new Subject()
        runtimeSubjects.set(runtimeName, subject)
        runtimes.set(runtimeName, await runtimeMap.get(runtimeName)(subject))
      }
      const subject = runtimeSubjects.get(runtimeName)
      const runtime = runtimes.get(runtimeName)
      
      Promise
        .resolve()
        .then(() => subject.next(task))

      return (
        runtime
        |> filter(({ task: _task }) => _task === task)
      )
    }
  )
  |> finalize(() =>
    Array.from(
      runtimeSubjects.values())
        .forEach(subject =>
          subject.complete()
        )
  )
}
