import puppeteer, { Page, Browser } from 'puppeteer'
import { switchMap } from 'rxjs/operators'
import { Observable } from 'rxjs'

export default async (options = {}) => {
  const browser = await puppeteer.launch({ devtools: false })

  return Observable.create(observer => {
    const page = browser.newPage()
    page.then(page => observer.next(page))
    return async _ => (await page).close()
  })
}
