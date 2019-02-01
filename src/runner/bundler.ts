import Path from 'path'
import Bundler from 'parcel-bundler'
import { Observable } from 'rxjs'
import { Options } from '../types'

export default (options: Options) => {
  const observable = Observable.create(observer => {
    const bundler = new Bundler(options.entryFiles, {
      outDir: '.epk/dist',
      watch: true,
      cache: true,
      cacheDir: '.epk/cache',
      minify: false,
      scopeHoist: false,
      hmr: false,
      target: 'browser',
      logLevel: 0, // 3 = log everything, 2 = log warnings & errors, 1 = log errors
      sourceMaps: true, // Enable or disable sourcemaps, defaults to enabled (minified builds currently always create sourcemaps)
      detailedReport: false
    })
    bundler.addAssetType('js', Path.resolve(__dirname, '../src/runner/js-asset.ts'))
    bundler.addAssetType('ts', Path.resolve(__dirname, '../src/runner/ts-asset.ts'))
    bundler.on('bundled', bundle =>
      observer.next({ options, bundler: observable, name: 'bundled', bundle, buildEndTime: Date.now() }))
    bundler.on('buildStart', entryFiles  =>
      observer.next({ options, bundler: observable, name: 'buildStart', entryFiles , buildStartTime: Date.now() }))
    bundler.on('buildEnd', _ =>
      observer.next({ name: 'buildEnd' }))
    bundler.on('buildError', error =>
      observer.next({ name:'error', error }))
    bundler.bundle()
    return _ => bundler.stop()
  })
  return observable
}
