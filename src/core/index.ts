import { merge, ConnectableObservable, from, of } from 'rxjs'
import { map, filter, mergeMap, switchMap, publish, tap, delayWhen } from 'rxjs/operators'

import { Options, BUNDLER_TARGET, TARGET, File, TargetRuntimeProvider as TargetRuntimeProviderType } from '../types'
import Bundler from './bundler'
import { transformPathToTestUrl } from '../utils/index'
import TargetRuntimeProvider from './target-runtime-provider'
import analyze from './analyze'
import test from './test'
import postAnalyze from './post-analyze'
import { isBrowser } from './utils'
import server from './server'
import localRequire from '../utils/localRequire'


export default (_options: Options) => {
  // remove undefined values
  Object.keys(_options).forEach(key => _options[key] === undefined && delete _options[key])

  const target = _options.target || BUNDLER_TARGET.BROWSER
  const options = {
    browsers: ['chrome'],
    target,
    outDir: `.epk/dist/${target}`,
    watch: true,
    cache: true,
    cacheDir: `.epk/cache/${target}`,
    port: undefined,
    minify: false,
    scopeHoist: false,
    logLevel: 0, // 3 = log everything, 2 = log warnings & errors, 1 = log errors
    sourceMaps: true, // Enable or disable sourcemaps, defaults to enabled (minified builds currently always create sourcemaps)
    detailedReport: false,
    throwErrors: true,
    hmr: false,
    // apply options
    ..._options
  }
  let _port
  if (!isBrowser && options.target === BUNDLER_TARGET.BROWSER) {
    _port = localRequire('get-port')
              .then(getPort => getPort({ port: 10485 }))
              .then(port => (options.port = port))
  }
  // @ts-ignore
  return of([
            Bundler(options),
            (!isBrowser && options.target === BUNDLER_TARGET.BROWSER
              ? options.browsers as unknown as TARGET[]
              : [options.target] as unknown as TARGET[])
                .map(target => TargetRuntimeProvider(target, options))
          ])
          // @ts-ignore
          |> (!isBrowser && options.target === BUNDLER_TARGET.BROWSER ? delayWhen(() => from(_port)) : tap())
          // @ts-ignore
          |> (!isBrowser && options.target === BUNDLER_TARGET.BROWSER ? server(options) : tap())
          // @ts-ignore
          |> mergeMap(([ bundler, targetRuntimeProviders ]) =>
            merge(
              // @ts-ignore
              bundler |> filter(({ name }) => name === 'buildStart'),
              // @ts-ignore
              bundler |> filter(({ name }) => name === 'bundled'),
              // @ts-ignore
              merge(...targetRuntimeProviders)
              // @ts-ignore
              |> mergeMap((targetRuntimeProvider: TargetRuntimeProviderType) =>
                // @ts-ignore
                bundler
                // @ts-ignore
                |> filter(({ name }) => name === 'bundled')
                // @ts-ignore
                |> switchMap(({ bundle }) =>
                  // @ts-ignore
                  from(
                    (bundle.isEmpty
                      ? Array.from(bundle.childBundles)
                      : [bundle]))
                    // @ts-ignore
                    |> mergeMap((childBundle: any) => {
                      const { name: path } = childBundle
                      // @ts-ignore
                      const newContextObservable: ConnectableObservable<File> =
                        // @ts-ignore
                        of({
                          target: targetRuntimeProvider.target,
                          name: childBundle.entryAsset.name,
                          path,
                          url: options.target === BUNDLER_TARGET.BROWSER && transformPathToTestUrl(path, options.port)
                        })
                        // @ts-ignore
                        |> publish()

                      // @ts-ignore
                      const analyzedObservable: ConnectableObservable<File> =
                        // @ts-ignore
                        newContextObservable
                        // @ts-ignore
                        |> analyze(targetRuntimeProvider, options)
                        // @ts-ignore
                        |> publish()
          
                      // @ts-ignore
                      const testedObservable: ConnectableObservable<File> =
                        // @ts-ignore
                        analyzedObservable
                        // @ts-ignore
                        |> filter(({ errors }) => !errors.length)
                        // @ts-ignore
                        |> switchMap(file =>
                          // @ts-ignore
                          from(file.tests)
                          // @ts-ignore
                          |> test(file, targetRuntimeProvider, options))
                        // @ts-ignore
                        |> publish()

                      // @ts-ignore
                      const postAnalyzeObservable: ConnectableObservable<File> =
                        // @ts-ignore
                        testedObservable
                        // @ts-ignore
                        |> postAnalyze(options, childBundle)
                        // @ts-ignore
                        |> publish()
          
                      const testerObservable =
                        merge(
                          newContextObservable,
                          analyzedObservable,
                          testedObservable,
                          postAnalyzeObservable
                        )
          
                      postAnalyzeObservable.connect()
                      testedObservable.connect()
                      analyzedObservable.connect()
                      newContextObservable.connect()

                      return testerObservable
                    })
              )
            )
          )
        )
}
