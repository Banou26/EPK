import path from 'path'

import { Observable } from 'rxjs'
import ParcelBundler from 'parcel-bundler'

import { Bundler } from '../../types.ts'

export default (options = undefined): Bundler =>
  Observable.create(observer => {
    const bundler = new ParcelBundler(options.entryFiles, options)

    bundler.addAssetType('js', path.resolve(__dirname, '../src/core/parcel/js-asset.js'))
    bundler.addAssetType('ts', path.resolve(__dirname, '../src/core/parcel/ts-asset.js'))

    bundler.on('bundled', bundle =>
      observer.next({ name: 'bundled', parcelBundle: bundle, buildEndTime: Date.now() }))
    bundler.on('buildStart', entryFiles =>
      observer.next({ name: 'buildStart', entryFiles, buildStartTime: Date.now() }))
    bundler.on('buildEnd', () =>
      observer.next({ name: 'buildEnd' }))

    const emitError = err => observer.error(err)
    bundler.on('buildError', emitError)
    bundler
      .bundle()
      .catch(emitError)

    return () =>
      bundler
        .stop()
        .catch(emitError)
  })
