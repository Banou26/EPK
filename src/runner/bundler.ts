import Path from 'path'
import Bundler from 'parcel-bundler'
import { Observable } from 'rxjs'

export default entryFiles =>
  Observable.create(observer => {
    const bundler = new Bundler(entryFiles, {
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
      observer.next({ name: 'bundled', bundle }))
    bundler.on('buildStart', entryPoints =>
      observer.next({ name: 'buildStart', entryPoints }))
    bundler.on('buildEnd', _ =>
      observer.next({ name: 'buildEnd' }))
    bundler.on('buildError', error =>
      observer.next({ name:'error', error }))
    bundler.bundle()
    return _ => bundler.stop()
  })
