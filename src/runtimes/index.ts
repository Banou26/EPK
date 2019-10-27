import { of, Subject } from 'rxjs'
import { finalize, filter, shareReplay } from 'rxjs/operators'

import chrome from './chrome.ts'
import emit from '../utils/emit.ts'

export enum RUNTIMES {
  CHROME = 'chrome'
}

export const runtimeMap = new Map([
  [RUNTIMES.CHROME, chrome]
])

export default options => {
  const runtimes = new Map()

  return emit(
    async (runtimeName, task) => {
      if (!runtimes.has(runtimeName)) {
        const obs = await runtimeMap.get(runtimeName)()
        let runTask
        const sub = obs.subscribe(_runTask => (runTask = _runTask))
        runtimes.set(runtimeName, {
          subscription: sub,
          runTask
        })
      }

      return runtimes.get(runtimeName).runTask(task)

      // return task => {
      //   subject.next(task)
      //   return (
      //     runtime
      //     |> filter(({ task: _task }) => _task === task)
      //   )
      // }
    }
  )
  |> finalize(() =>
    Array.from(runtimeSubjects.values())
      .forEach(({ subscription }) => subscription.unsubscribe())
  )
}
