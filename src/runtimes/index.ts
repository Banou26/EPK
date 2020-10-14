import { of, isObservable, ReplaySubject } from 'rxjs'
import { finalize, filter, shareReplay } from 'rxjs/operators'

import chrome from './chrome'
import emit from '../utils/emit'

export enum RUNTIMES {
  CHROME = 'chrome'
}

export const runtimeMap = new Map([
  [RUNTIMES.CHROME, chrome]
])

export default options => {
  const runtimes = new Map()
  return (
    emit(async runtimeName => {
        if (!runtimes.has(runtimeName)) {
          const obs = await runtimeMap.get(runtimeName)()
          let createContext
          const sub = obs.subscribe(_createContext => (createContext = _createContext))
          runtimes.set(runtimeName, {
            subscription: sub,
            createContext
          })
        }

        return runtimes.get(runtimeName).createContext
      }
    )
    |> finalize(() =>
      Array.from(runtimes.values())
        .forEach(({ subscription }) => subscription.unsubscribe())
    )
  )
}
