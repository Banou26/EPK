import type { TestConfig } from '../types'

import { from, merge, of, partition } from 'rxjs'

import { filter, map, mergeMap, share, switchMap, tap } from 'rxjs/operators'

import esbuild from './esbuild'
import { createContext } from '../platforms'

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
                      filter(({ data: { tests } }) => tests),
                      map(({ data: { tests } }) => tests),
                      tap(tests => console.log('register done', tests)),
                      share()
                    )
      
                const test =
                  register
                    .pipe(
                      tap(tests => console.log('tests', tests)),
                      map(tests => ({
                        type: 'run',
                        data: { tests }
                      })),
                      tap(tests => console.log('testing done', tests)),
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
