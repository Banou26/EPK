import Path from 'path'
import ParcelBundler from 'parcel-bundler'
import { Observable } from 'rxjs'
import { Bundler } from '../types'
import { publish } from 'rxjs/operators'

export default (options): Bundler =>
  // @ts-ignore
  (Observable.create(observer => {
    const bundler = new ParcelBundler(options.entryFiles, options)
    bundler.addAssetType('js', Path.resolve(__dirname, '../src/core/js-asset.ts'))
    bundler.addAssetType('ts', Path.resolve(__dirname, '../src/core/ts-asset.ts'))
    bundler.on('bundled', bundle =>
      observer.next({ options, name: 'bundled', bundle, buildEndTime: Date.now() }))
    bundler.on('buildStart', entryFiles  =>
      observer.next({ options, name: 'buildStart', entryFiles , buildStartTime: Date.now() }))
    bundler.on('buildEnd', _ =>
      observer.next({ name: 'buildEnd' }))
    bundler.on('buildError', error =>
      observer.next({ name:'error', error }))
    
    bundler.bundle()
    return _ => bundler.stop()
  })
  // @ts-ignore
  |> publish())
  // @ts-ignore
  .refCount()