
import { Subject, of } from 'rxjs'
import { map, tap, finalize, shareReplay, filter, combineLatest } from 'rxjs/operators'

import { require } from '../utils/package-manager.ts'
import emit from '../utils/emit.ts'
import { GLOBALS } from '../runtime/index.ts'
import mergeMap from '../utils/mergeMap.ts'


export default async () => {
  const puppeteer = await require('puppeteer', __filename)
  const browser = await puppeteer.launch({ devtools: true })

  return (
    emit((options, func) =>
      of(func)
      |> mergeMap(async func => {
        const page = await browser.newPage()
        const pageMessages = new Subject()

        await page.addScriptTag({ path: options.filePath })
        await page.exposeFunction(GLOBALS.SEND_MESSAGE, msg => pageMessages.next(msg))

        let count = 0
        return (
          func(task => {
            const id = count
            count++

            return (
              task
              |> tap(message =>
                page.evaluate(
                  (message, GLOBALS) => globalThis[GLOBALS.MESSAGES].next(message),
                  {
                    id,
                    ...message
                  },
                  GLOBALS
                )
              )
              |> combineLatest(pageMessages, (_, task) => task)
              |> filter(({ id: _id }) => _id === id)
            )
          })
          |> finalize(() => page.close())
        )
      })
      |> mergeMap(obs => obs)
    )
    |> finalize(() => browser.close())
  )
}
