import { finalize } from 'rxjs/operators'

import { of } from 'rxjs'
import chrome from './chrome.ts'

const runtimeMap = new Map([
  ['chrome', chrome]
])

export default options => {
  const runtimeSubjects = new Map()
  const runtimes = new Map()

  return of(
    (runtimeName, task) => {
      if (!runtimes.has(runtimeName)) {
        const subject = new Subject()
        runtimeSubjects.set(runtimeName, subject)
        runtimes.set(runtimeName, runtimeMap.get(runtimeName)(subject))
      } else {
        const subject = runtimeSubjects.get(runtimeName)
        subject.next(task)
      }
    }
  )
  |> finalize(() => {
    for (const [, subject] of runtimeSubjects) {
      subject.complete()
    }
  })
}
