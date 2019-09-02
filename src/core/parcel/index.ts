import path from 'path'

import { Observable } from 'rxjs'
import ParcelBundler from 'parcel-bundler'

import _Parcel from '@parcel/core'
const { default: Parcel } = _Parcel

import { Bundler } from '../../types.ts'

export default (options = undefined): Bundler =>
  Observable.create(observer => {
    const parcel = new Parcel(options)

    const emitError = err => observer.error(err)

    const unsub = parcel.watch((err, buildEvent) => {
      if (err) emitError(err)
      const { type } = buildEvent
      if (type === 'buildFailure') {
        emitError(buildEvent)
      } else if (type === 'buildSuccess') {
        observer.next(buildEvent)
      }
    })

    return () => unsub().catch(emitError)
  })
