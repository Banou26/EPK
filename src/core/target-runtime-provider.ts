import { map } from 'rxjs/operators'

import ChromeRuntime from '../targets/chrome.ts'
// import FirefoxRuntime from '../targets/firefox.ts'
import { TARGET, TargetRuntimeProviderOptions, TargetRuntimeProvider, TargetRuntimeObservable } from '../types.ts'

const targetRuntimes = new Map([
  [TARGET.CHROME, ChromeRuntime],
  // [TARGET.FIREFOX, FirefoxRuntime]
])

export default
  (target: TARGET, options: TargetRuntimeProviderOptions): TargetRuntimeProvider => {
    const targetRuntimeProvider = targetRuntimes.get(target)(options)
    targetRuntimeProvider.target = target
    targetRuntimeProvider.options = options
    // @ts-ignore
    return targetRuntimeProvider
      // @ts-ignore
      |> map((targetRuntime: TargetRuntimeObservable) => {
        targetRuntime.target = target
        targetRuntime.options = options
        return targetRuntime
      })
  }
