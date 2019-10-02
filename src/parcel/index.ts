import _Parcel from '@parcel/core'

import AsyncObservable from '../utils/async-observable.ts'

const { default: Parcel } = _Parcel

export type JSONReportEvent =
  | {
      type: 'log',
      level: 'info' | 'success' | 'verbose' | 'progress' | 'warn' | 'error',
      message: string
    }
  | {type: 'buildStart'}
  | {type: 'buildFailure', message: string}
  | {
      type: 'buildSuccess',
      buildTime: number,
      bundles?: any
    }
  | JSONProgressEvent

export type JSONProgressEvent =
  | {
      type: 'buildProgress',
      phase: 'transforming',
      filePath: string
    }
  | {type: 'buildProgress', phase: 'bundling'}
  | {
      type: 'buildProgress',
      phase: 'packaging' | 'optimizing',
      bundleFilePath?: string
    }

export enum PARCEL_REPORTER_EVENT {
  BUILD_START = 'buildStart',
  BUILD_PROGRESS = 'buildProgress',
  BUILD_SUCCESS = 'buildSuccess',
  BUILD_FAILURE = 'buildFailure',
  LOG = 'log'
}

export default (initialParcelOptions) =>
  AsyncObservable(async observer => {
    // const parcel = new Parcel(initialParcelOptions)

    const parcel = new Parcel({
      entries: ['tests/test.ts', 'tests/test2.ts'],
      targets: {
        test: {
          distDir: 'dist/browser',
          "browsers": ["> 1%", "not dead"]
        }
      },
      sourceMaps: true,
      minify: true,
      scopeHoist: true
    })
    
    const { unsubscribe } = await parcel.watch((err, build) => {
      if (err) observer.throw(err)
      debugger
      observer.next(build)
    })

    return () => unsubscribe()
  })
