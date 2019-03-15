import { Observable } from 'rxjs'
import { TARGET, Target } from '../types'


export default
  (environment: TARGET): Observable<Target> => {
    const instances = []

    return Observable.create(observer => {
      let page
      (async () => {
        page = await browsers[TARGET.CHROME].newPage()
        // await page.on('console', msg => logger.log(`browser: ${msg.text()}`))
        await page.goto(`http://localhost:${await port}/epk/browser-runner.html`)
        observer.next(page)
      })()
      return async _ => (await page).close()
    })
  }