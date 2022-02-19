import { of, isObservable, ReplaySubject, Observable } from 'rxjs'
import { finalize, filter, shareReplay } from 'rxjs/operators'

import chrome from './chrome'
import emit from '../utils/emit'

export enum RUNTIME {
  CHROME = 'chrome'
}

export const runtimeMap = new Map([
  [RUNTIME.CHROME, chrome]
])

// export type TargetRuntime = () =>
//   Promise<
//     Observable<(options: any, func: (args) => (messages) => Observable<any>) => >
//   >

export default (options?: {}) => {
  const runtimes = new Map<RUNTIME, any>()
  return (
    emit(async (runtimeName: RUNTIME) => {
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
    })
    .pipe(
      finalize(() =>
        Array.from(runtimes.values())
          .forEach(({ subscription }) => subscription.unsubscribe())
      )
    )
  )
}
