import Parcel from '@parcel/core'
import config from '@parcel/config-default'

import AsyncObservable from '../utils/async-observable.ts'

export enum PARCEL_REPORTER_EVENT {
  BUILD_START = 'buildStart',
  BUILD_PROGRESS = 'buildProgress',
  BUILD_SUCCESS = 'buildSuccess',
  BUILD_FAILURE = 'buildFailure',
  LOG = 'log'
}

export default (initialParcelOptions) =>
  AsyncObservable(async observer => {
    const parcel = new Parcel({
      defaultConfig: {
        ...config,
        filePath: require.resolve('@parcel/config-default')
      },
      entries: ['tests/unit/index_test.ts'],
      targets: {
        test: {
          distDir: '.epk/dist/browser',
          publicUrl: './'
          // browsers: ['last 1 Chrome versions']
        }
      },
      cacheDir: '.epk/parcel-cache',
      mode: 'production',
      sourceMaps: true,
      minify: true,
      scopeHoist: false,
      cache: false
    })
    
    const { unsubscribe } = await parcel.watch((err, build) => {
      if (err) observer.throw(err)
      observer.next(build)
    })

    return () => unsubscribe()
  })
