import { map, tap, finalize, mergeMap, shareReplay, filter } from 'rxjs/operators'

import { require } from '../utils/package-manager.ts'
import emit from '../utils/emit.ts'
import { Subject } from 'rxjs'
import { GLOBALS } from '../runtime'


export default async (contextObservable) => {
  const puppeteer = await require('puppeteer', __filename)
  const browser = await puppeteer.launch()


  return (
    contextObservable
    |> mergeMap(async (taskObservable) => {
      const page = await browser.newPage()
      const pageMessages = new Subject()

      await page.exposeFunction(GLOBALS.SEND_MESSAGE, msg => pageMessages.next(msg))

      return (
        taskObservable
        |> mergeMap((task, id) =>
          task
          |> tap(message =>
            page.evaluate(
              message => globalThis[GLOBALS.MESSAGES].next(message),
              {
                id,
                ...message
              }
            )
          )
          |> combineLatest(pageMessages, (_, task) => task)
          |> filter(({ id: _id }) => _id === id)
        )
        |> finalize(() => page.close())
      )
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
