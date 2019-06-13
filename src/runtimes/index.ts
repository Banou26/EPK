import { RUNTIME, RuntimeProvider } from '../types.ts'

import chrome from './chrome.ts'
import { map } from 'rxjs/operators'
import { Observable } from 'rxjs'

const runtimeMap = new Map<RUNTIME, (...args) => Observable<RuntimeProvider>>([
  [RUNTIME.CHROME, chrome]
])

for (const [runtimeName, runtime] of runtimeMap) {
  runtimeMap.set(
    runtimeName,
    (...args) =>
      // @ts-ignore
      runtime(...args)
      // @ts-ignore
      |> map((provider: RuntimeProvider) => {
        provider.runtimeName = runtimeName
        return provider
      }))

  runtimeMap.get(runtimeName).runtimeName = runtimeName
}

export default (runtime: RUNTIME) =>
runtimeMap.get(runtime)
