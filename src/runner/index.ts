import Path from 'path'
import chalk from 'chalk'
import fg from 'fast-glob'
import { filter, publish, switchMap, tap, catchError } from 'rxjs/operators'
import puppeteer, { Page, Browser } from 'puppeteer'
import cli from './cli'
import { prettifyTime } from './utils'
import Bundler from './bundler'
import logger from './logger'
import { port } from './server'
import { browser as analyzeBrowser } from './analyze'
import { browser as testBrowser } from './test'
import { test } from '../test';

const init = async ({ node = false } = {}) => {
  let pageReload, buildTimeStart, buildTimeEnd, analyzeTimeStart, analyzeTimeEnd, testTimeStart, testTimeEnd
  
  const globs: string[] = await cli()

  const browser: Browser = await puppeteer.launch({ devtools: true })
  const page: Page = !node && (await browser.pages())[0]
  
  page.on('console', msg => logger.log(`browser: ${msg.text()}`))

  await page.goto(`http://localhost:${await port}/epk/browser-runner.html`)

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
    pageReload = page.reload()
    buildTimeStart = Date.now()
    logger.progress(`\n${chalk.grey(`Building ${entryFilesDisplayNames}`)}`)
  })

  const error = bundler
    |> filter(({ name }) => name === 'buildError')
    |> catchError(error => logger.error(error))
  error.subscribe(_ =>
    logger.error(error))

  const analyzed =
    bundler
      |> filter(({ name }) => name === 'bundled')
      |> tap(_ => {
          buildTimeEnd = Date.now()
          logger.progress(`\n${
            chalk.green(`Built in ${prettifyTime(buildTimeEnd - buildTimeStart)}.`)
          }\n${
            chalk.grey(`Analyzing ${entryFilesDisplayNames}`)}.`)
        })
      |> switchMap(({ bundle }): Promise<Context> =>
          pageReload.then(_ => ({
            bundle
          }))
        )
      |> tap(_ => {
          analyzeTimeStart = Date.now()
        })
      |> analyzeBrowser(page)
      |> tap(_ => {
          analyzeTimeEnd = Date.now()
          testTimeStart = Date.now()
          logger.progress(`\n${
            chalk.green(`Built in ${prettifyTime(buildTimeEnd - buildTimeStart)}.`)
          }\n${
            chalk.green(`Analyzed in ${prettifyTime(analyzeTimeEnd - analyzeTimeStart)}.`)
          }\n${
            chalk.green(`Testing ${entryFilesDisplayNames}.`)}`)
        })
      |> testBrowser(page)
      |> tap(_ => {
        testTimeEnd = Date.now()
        logger.success(`\n${
          chalk.green(`Built in ${prettifyTime(buildTimeEnd - buildTimeStart)}.`)
        }\n${
          chalk.green(`Analyzed in ${prettifyTime(analyzeTimeEnd - analyzeTimeStart)}.`)
        }\n${
          chalk.green(`Tested in ${prettifyTime(testTimeEnd - testTimeStart)}.`)
        }${
          chalk.red(`\nErrors:`)}\n${
            chalk.red(
              Object.entries(
                _.testsResult
                  .reduce((obj, test) =>
                    (obj[test.url]
                      ? obj[test.url].push(test)
                      : obj[test.url] = [test]
                    , obj), {}))
                .map(([url, tests]) =>
                  `${url}\n${
                    tests
                      .map(({ description, error: { message } }) =>
                      `${description}\n${
                        message}`)
                      .join('\n')
                  }`
                  )
                )
          }`)
      })
  analyzed.subscribe(val => {
    // logger.log(`finalValue: ${JSON.stringify(val.testsResult)}`)
  })

  bundler.connect()
}

init()