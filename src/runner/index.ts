import Path from 'path'
import chalk from 'chalk'
import fg from 'fast-glob'
import { timer } from 'rxjs'
import { filter, publish, switchMap, map, tap, catchError } from 'rxjs/operators'
import puppeteer from 'puppeteer'
import cli from './cli.ts'
import { prettifyTime, log, frames, x, check, getFrame } from './utils.ts'
import Bundler from './bundler.ts'
import logger from './logger.ts'
import analyze from './analyze.ts'

const init = async _ => {
  let buildTimeStart, buildTimeEnd, analyzeTimeStart, analyzeTimeEnd

  const globs = await cli()
  const browser = await puppeteer.launch({ devtools: false })
  const entryFiles =
    (await fg.async(globs))
      .map(path =>
        Path.join(process.cwd(), path))
  const entryFilesDisplayNames =
    entryFiles
      .map(path =>
        Path.win32.basename(path))
      .join(', ')

  const bundler =
    Bundler(entryFiles)
      |> publish()

  const building =
    bundler
      |> filter(({name}) => name === 'buildStart')
  building.subscribe(_ => {
    logger.clear()
    buildTimeStart = Date.now()
    logger.progress(chalk.grey(`Building ${entryFilesDisplayNames}`))
  })

  const error = bundler
    |> filter(({name}) => name === 'buildError')
    |> catchError(error => logger.error(error))
  error.subscribe(_ =>
    logger.error(error))

  const analyzed =
    bundler
      |> filter(({name}) => name === 'bundled')
      |> tap(_ => {
          buildTimeEnd = Date.now()
          logger.progress(chalk.green(`Built in ${prettifyTime(buildTimeEnd - buildTimeStart)}.`))
        })
      |> map(({bundle}) => bundle)
      |> tap(_ => {
          analyzeTimeStart = Date.now()
          logger.progress(chalk.grey(`Analyzing ${entryFilesDisplayNames}`))
        })
      |> analyze({ browser })
      |> tap(_ => {
          analyzeTimeEnd = Date.now()
          logger.progress(chalk.green(`Analyzed in ${prettifyTime(analyzeTimeEnd - analyzeTimeStart)}.`))
        })
  analyzed.subscribe(val => {})

  bundler.connect()
}

init()