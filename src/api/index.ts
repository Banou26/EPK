import chalk from 'chalk'
import { map, tap, filter, mergeMap, switchMap } from 'rxjs/operators'

import { Options, Context } from '../types'
import Bundler from '../runner/bundler'
import logger from '../cli/logger'
import { prettifyPath } from './utils'
import PageProvider from './page-provider'
import analyze from './analyze'

export default (options: Options) =>
  // @ts-ignore
  Bundler(options)
    // @ts-ignore
  |> filter(({ name }) => name === 'buildStart')
  // @ts-ignore
  |> mergeMap(async ctx => ({
    ...ctx,
    pageProvider: await PageProvider()
  }))
  // @ts-ignore
  |> tap(({ entryFiles  }: Context) => {
    logger.clear()
    logger.progress(`\n${chalk.grey(`Building ${entryFiles.map(prettifyPath).join(', ')}`)}`)
  })
    // @ts-ignore
  |> switchMap(({ entryFiles, buildStartTime }) =>
    // @ts-ignore
    bundler
    // @ts-ignore
    |> filter(({ name }) => name === 'bundled')
    // @ts-ignore
    |> map(ctx => ({
      ...ctx,
      entryFiles,
      buildStartTime
    }))
    // @ts-ignore
    |> analyze
  )
