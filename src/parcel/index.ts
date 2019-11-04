import Parcel from '@parcel/core'

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
      entries: ['tests/unit/index_test.ts'],
      targets: {
        test: {
          distDir: '.epk/dist/browser',
          browsers: ['last 1 Chrome versions'] // ["> 1%", "not dead"]
        }
      },
      sourceMaps: true,
      minify: true,
      scopeHoist: true
    })
    
    const { unsubscribe } = await parcel.watch((err, build) => {
      if (err) observer.throw(err)
      observer.next(build)
    })

    return () => unsubscribe()
  })