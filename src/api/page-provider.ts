import puppeteer, { Page, Browser } from 'puppeteer'
import puppeteerFF from 'puppeteer'
import { switchMap } from 'rxjs/operators'
import { Observable } from 'rxjs'
import { BROWSER, Options } from '../types'
import { port } from './server'

const getChrome = () => puppeteer.launch({ devtools: true })
const getFirefox = () => puppeteerFF.launch({ devtools: false })

const browsers = {
  [BROWSER.CHROME]: getChrome,
  [BROWSER.CHROME_CANARY]: getChrome,
  [BROWSER.FIREFOX]: getFirefox,
  [BROWSER.FIREFOX_NIGHTLY]: getFirefox
}

const getBrowsers = async (browserList: BROWSER[]) =>
  (await Promise.all(
    browserList
      .map(browser => browsers[browser]())))
    .reduce((o, v, k) => (o[browserList[k]] = v, o), {})

export default async (options: Options) => {
  const browsers = await getBrowsers(options.browsers)

  return {
    [BROWSER.CHROME]: Observable.create(observer => {
      let page
      (async () => {
        observer.next(page = await browsers[BROWSER.CHROME].newPage())
        await page.goto(`http://localhost:${await port}/epk/browser-runner.html`)
      })()
      return async _ => (await page).close()
    }),
    [BROWSER.FIREFOX]: Observable.create(observer => {
      let page
      (async () => {
        observer.next(page = await browsers[BROWSER.FIREFOX].newPage())
        await page.goto(`http://localhost:${await port}/epk/browser-runner.html`)
      })()
      return async _ => (await page).close()
    })
  }
}
