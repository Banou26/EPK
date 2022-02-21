import type { Observer } from 'rxjs'
import type { BuildOutputFile } from 'src/core/esbuild'

import type { Platform, TestConfig } from '../core'

import asyncObservable from '../utils/async-observable'
import chromium from './chromium'

type MapPlatform = ({ config, output }: { config: TestConfig, output: BuildOutputFile }) => any

export type PlatformRuntime = any

const platforms: Record<Platform, PlatformRuntime> = {
  'chromium': chromium,
  'node': undefined
}

export default ({ configs }: { configs: TestConfig[] }) =>
  asyncObservable<MapPlatform>(async (observer: Observer<MapPlatform>) => {
    // const platforms = new Map<TestConfig, PlatformRuntime>()

    observer.next(({ config, output }) => platforms[config.platform]({ config, output }))

    return () => {

    }
  })

  
  import { finalize, share, tap } from 'rxjs/operators'
  
export const createContext = ({ config, output }: { config: TestConfig, output: BuildOutputFile }) =>
  platforms[config.platform]({ config, output })

// export const createContext = ({ config, output }: { config: TestConfig, output: BuildOutputFile }) => {
//   const context = platforms[config.platform]({ config, output })

//   return (
//     ({ options } = {}) =>
//       observable =>
//         observable
//           .pipe(
//             tap(val => console.log('tap', val)),
//             share(),
//             finalize(() => {

//             })
//           )
//   )
//     // func(val, getContext)
// }

