import chalk from 'chalk'
import { map, tap, filter, mergeMap, switchMap } from 'rxjs/operators'

import { Options, Context, Page } from '../types'
import Bundler from '../runner/bundler'
import logger from '../cli/logger'
import { prettifyPath, transformPathToUrl } from './utils'
import PageProvider from './page-provider'
import analyze from './analyze'

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
    const files: File[] =
      entryFiles
        .map(path => ({
          path,
          url: transformPathToUrl(path)
        }))
    // @ts-ignore
    return bundler
      // @ts-ignore
      |> filter(({ name }) => name === 'bundled')
      // @ts-ignore
      |> mergeMap(async ctx => ({
        ...ctx,
        pageProvider: await PageProvider(options)
      }))
      // @ts-ignore
      |> map(ctx => ({
        ...ctx,
        browsers: options.browsers,
        files,
        entryFiles,
        buildStartTime
      }))
      // @ts-ignore
      |> analyze
      // @ts-ignore
      |> tap(res => logger.progress(`${res}`))
  })
