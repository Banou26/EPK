import type { BuildOptions } from 'esbuild'
import { combineLatest, concat, from, merge, of, partition } from 'rxjs'

import { filter, map, mergeMap, share, switchMap, tap } from 'rxjs/operators'

import buildObservable from './esbuild'
import platformProvider from '../platforms'
import esbuild from './esbuild'
import { createContext } from '../platforms'

export type Platform = 'node' | 'chromium'
export type LogLevel = 'none' | 'error' | 'warn' | 'info'

export type TestConfig =   {
  name: string
  platform: Platform
  browserTestGlob: string
  logLevel: LogLevel
  esbuild: BuildOptions
}

export default ({ configs }: { configs: TestConfig[] }) =>
  from(configs)
    .pipe(
      mergeMap((config) => {
        const build =
          esbuild({ testConfig: config, esbuildOptions: config.esbuild })
            .pipe(map(build => ({ build, config }) as const))

        const [built, error] = partition(build, ({ build }) => build.type === 'success')

        const test =
          built
            .pipe(
              switchMap(({ build, config }) => {
                const runInContext = createContext({ config, output: build.output[0] })

                const register =
                  of({ type: 'register' })
                    .pipe(
                      runInContext(),
                      share()
                    )
      
                const test =
                  register
                    .pipe(
                      map(tests => ({
                        type: 'run',
                        tests
                      })),
                      runInContext()
                    )
      
                return merge(
                  register,
                  test
                )
              })
            )

        return merge(
          test
        )
      })
    )
