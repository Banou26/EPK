import { map, tap, finalize, mergeMap, shareReplay } from 'rxjs/operators'

import { require } from '../utils/package-manager.ts'
import emit from '../utils/emit.ts'

export default async () => {
  const puppeteer = await require('puppeteer', __filename)
  const browser = await puppeteer.launch()


  return (
    emit(async task => {
      const page = browser.newPage()

      return emit({
        runTask: () => {}
      })
    })
    |> finalize(() => browser.close())
  )
  // return (
  //   taskSubject
  //   |> mergeMap(async task => {

  //     return {
  //       task,
  //       page: await browser.newPage()
  //     }
  //   })
  //   |> finalize(async () => {
  //     await browser.close()
  //   })z
  // )
}
