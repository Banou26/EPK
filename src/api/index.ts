import chalk from 'chalk'
import { merge } from 'rxjs'
import { map, tap, filter, mergeMap, switchMap, publish } from 'rxjs/operators'

import { Options, Context, Page, AnalyzedContext, TestedContext } from '../types'
import Bundler from '../runner/bundler'
import logger from '../cli/logger'
import { prettifyPath, transformPathToUrl } from './utils'
import PageProvider from './page-provider'
import analyze from './analyze'
import { Observable } from 'rxjs'
import reporter from './reporter'

export default (options: Options) =>
  // @ts-ignore
  Bundler(options)
    // @ts-ignore
  |> filter(({ name }) => name === 'buildStart')
  // @ts-ignore
  |> tap(({ entryFiles  }: Context) => {
    logger.clear()
    logger.progress(`\n${chalk.grey(`Building ${entryFiles.map(prettifyPath).join(', ')}`)}`)
  })
    // @ts-ignore
  |> switchMap(({ bundler, entryFiles, buildStartTime }) => {
    // const files: File[] =
    //   entryFiles
    //     .map(path => ({
    //       path,
    //       url: transformPathToUrl(path)
    //     }))
    // @ts-ignore

    const ctxObservable: Observable<Context> =
      bundler
      // @ts-ignore
      |> filter(({ name }) => name === 'bundled')
      // @ts-ignore
      |> mergeMap(async ctx => ({
        ...ctx,
        pageProvider: await PageProvider(options)
      }))
      // @ts-ignore
      |> map(({ bundle, ...rest }) => ({
        bundle,
        ...rest,
        browsers: options.browsers,
        files:
          (bundle.isEmpty
            ? Array.from(bundle.childBundles)
            : [bundle])
              .map(({ name: path }) => ({
                path,
                url: transformPathToUrl(path)
              })),
        entryFiles,
        buildStartTime
      }))
      // @ts-ignore
      |> publish()

    const analyzedObservable: Observable<AnalyzedContext> =
      // @ts-ignore
      ctxObservable
      // @ts-ignore
      |> publish()

    const testedObservable: Observable<TestedContext> =
      // @ts-ignore
      analyzedObservable
      // @ts-ignore
      |> publish()

    const reporterObservable =
      // @ts-ignore
      merge(
        ctxObservable,
        analyzedObservable,
        testedObservable
      )
      // @ts-ignore
      |> reporter(options)

    testedObservable.connect()
    analyzedObservable.connect()
    ctxObservable.connect()

    return reporterObservable

    // return bundler
    //   // @ts-ignore
    //   |> filter(({ name }) => name === 'bundled')
    //   // @ts-ignore
    //   |> mergeMap(async ctx => ({
    //     ...ctx,
    //     pageProvider: await PageProvider(options)
    //   }))
    //   // @ts-ignore
    //   |> map(({ bundle, ...rest }) => ({
    //     bundle,
    //     ...rest,
    //     browsers: options.browsers,
    //     files:
    //       (bundle.isEmpty
    //         ? Array.from(bundle.childBundles)
    //         : [bundle])
    //           .map(({ name: path }) => ({
    //             path,
    //             url: transformPathToUrl(path)
    //           })),
    //     entryFiles,
    //     buildStartTime
    //   }))
    //   // @ts-ignore
    //   |> analyze
    //   // @ts-ignore
    //   |> tap(res => logger.progress(`${res}`))
  })
