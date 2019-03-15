import puppeteer, { Page, Browser } from 'puppeteer'
import puppeteerFF from 'puppeteer'
import { switchMap } from 'rxjs/operators'
import { Observable } from 'rxjs'
import { ENVIRONMENT, Options } from '../types'
import { port } from './server'
import logger from '../cli/logger'

const getChrome = () => puppeteer.launch({ devtools: true })
const getFirefox = () => puppeteerFF.launch({ devtools: false })

const browsers = {
  [ENVIRONMENT.CHROME]: getChrome,
  [ENVIRONMENT.CHROME_CANARY]: getChrome,
  [ENVIRONMENT.FIREFOX]: getFirefox,
  [ENVIRONMENT.FIREFOX_NIGHTLY]: getFirefox
}

const getBrowsers = async (browserList: ENVIRONMENT[]) =>
  (await Promise.all(
    browserList
      .map(browser => browsers[browser]())))
    .reduce((o, v, k) => (o[browserList[k]] = v, o), {})

export default async (options: Options) => {
  const browsers = await getBrowsers(options.browsers)

  return {
    [ENVIRONMENT.CHROME]: Observable.create(observer => {
      let page
      (async () => {
        page = await browsers[ENVIRONMENT.CHROME].newPage()
        // await page.on('console', msg => logger.log(`browser: ${msg.text()}`))
        await page.goto(`http://localhost:${await port}/epk/browser-runner.html`)
        observer.next(page)
      })()
      return async _ => (await page).close()
    }),
    [ENVIRONMENT.FIREFOX]: Observable.create(observer => {
      let page
      (async () => {
        page = await browsers[ENVIRONMENT.CHROME].newPage()
        // await page.on('console', msg => logger.log(`browser: ${msg.text()}`))
        await page.goto(`http://localhost:${await port}/epk/browser-runner.html`)
        observer.next(page)
      })()
      return async _ => (await page).close()
    })
  }
}
