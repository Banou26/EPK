import { BuildOutput, BuildOutputFile } from './esbuild'


import { pipe, Observable, of, generate, from, BehaviorSubject, zip, combineLatest, merge } from 'rxjs'
import { takeUntil, publish, filter, map, mapTo, switchMap, groupBy, mergeMap, tap, skip, toArray, share, take, shareReplay } from 'rxjs/operators'

import esbuild, { BUILD_EVENT } from './esbuild'
import { PARCEL_REPORTER_EVENT } from '../parcel'
import WorkerFarm from '../workerFarm'
import Task, { TASK_TYPE, TASK_STATUS } from './task'
import emit from '../utils/emit'
import AsyncObservable from '../utils/async-observable'
import runtimeFactory, { RUNTIME } from '../runtimes'
import preAnalyze from './pre-analyzer'

export type TargetedOutput = {
  target: RUNTIME,
  output: BuildOutputFile,
  buildOutput: BuildOutput
}

export default (options) =>
  combineLatest([
    esbuild(options),
    runtimeFactory()
  ])
  .pipe(
    filter(([{ type }]) => type === BUILD_EVENT.SUCCESS),
    switchMap(([buildOutput, runtime]) =>
      of(buildOutput.output)
        .pipe(
          mergeMap(outputs =>
            outputs.reduce<TargetedOutput[]>((arr, output) => [
              ...arr,
              {
                output,
                target: RUNTIME.CHROME,
                buildOutput
              }
            ], [])
          ),
          groupBy(
            ({ target }) => target,
            ({ target, buildOutput, output }) => ({ target, buildOutput, output })
          ),
          // Observable per target that emit output,
          mergeMap((output) =>
            combineLatest([
              output,
              from(runtime(output.key))
            ])
            .pipe(
              mergeMap(([{ output }, createContext]) => {

                const unisolatedContext = createContext({ filePath: output.file.path }, run => {
                  const preAnalyze =
                    emit({ type: TASK_TYPE.PRE_ANALYZE })
                      .pipe(
                        run(),
                        tap((val) => console.log('tap val', val)),
                        take(1),
                        tap((val) => console.log('tap val', val)),
                        share()
                      )
      
                  const tests =
                    preAnalyze
                      .pipe(
                        map(({ tests }) =>
                          tests
                            .filter(({ isolate, serial }) => !isolate && !serial)
                        ),
                        map(tests => ({
                          type: TASK_TYPE.RUN,
                          tests
                        })),
                        run()
                      )
      
                  return merge(
                    tests,
                    preAnalyze
                  )
                })
      
                return merge(
                  unisolatedContext
                )
              })
            )
          )
        )
    )
  )