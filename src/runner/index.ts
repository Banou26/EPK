import Path from 'path'
import chalk from 'chalk'
import fg from 'fast-glob'
import { filter, publish, switchMap, tap, catchError } from 'rxjs/operators'
import puppeteer, { Page, Browser } from 'puppeteer'
import cli from './cli'
import { prettifyPath, prettifyTime } from './utils'
import Bundler from './bundler'
import logger from './logger'
import { port } from './server'
import analyze from './analyze'
import test from './test'
import { of } from 'rxjs'
import postAnalyze from './post-analyze'

const init = async ({ node = false } = {}) => {
  let pageReload, buildTimeStart, buildTimeEnd, analyzeTimeStart, analyzeTimeEnd, testTimeStart, testTimeEnd
  logger.progress(`\n${chalk.grey(`Preparing the environment.`)}`)
  const globs: string[] = await cli()

  const browser: Browser = await puppeteer.launch({ devtools: true })
  const page: Page = !node && (await browser.pages())[0]
  
  page.on('console', msg => logger.log(`browser: ${msg.text()}`))

  await page.goto(`http://localhost:${await port}/epk/browser-runner.html`)

  const entryFiles =
    (await fg.async(globs))
      .map(path => Path.join(process.cwd(), path))

  const runner =
    Bundler(entryFiles)
    |> filter(({ name }) => name === 'buildStart')
    |> tap(_ => {
        logger.clear()
        logger.progress(`\n${chalk.grey(`Building ${entryFiles.map(prettifyPath).join(', ')}`)}`)
      })
    |> switchMap(({ bundler, entryPoints, buildStartTime }) =>
        bundler
        |> filter(({ name }) => name === 'bundled')
        |> switchMap(async ctx => {
            await page.reload()
            return {
              bundler,
              entryPoints,
              page,
              buildStartTime,
              ...ctx
            }
          })
        |> analyze
        |> test
        |> postAnalyze)

  const sub = runner.subscribe(_ => {})
  return {
    unsubscribe: _ => sub.unsubscribe()
  }
}

if (!module.parent) init()