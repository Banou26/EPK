
import { Subject, of } from 'rxjs'
import { map, tap, finalize, shareReplay, filter, combineLatest, takeUntil } from 'rxjs/operators'

import { require } from '../utils/package-manager.ts'
import emit from '../utils/emit.ts'
import { GLOBALS } from '../runtime/index.ts'
import mergeMap from '../utils/mergeMap.ts'
import { TASK_STATUS } from '../core/task.ts'


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
        await page.exposeFunction(GLOBALS.SEND_MESSAGE, msg => {pageMessages.next(msg)})

        let count = 0
        return (
          func(messages => {
            const id = count
            count++

            return (
              messages
              |> finalize(() =>
                page.evaluate(
                  (message, GLOBALS) => globalThis[GLOBALS.MESSAGES].next(message),
                  {
                    id,
                    status: TASK_STATUS.CANCEL,
                  },
                  GLOBALS
                )
              )
              |> tap(message =>
                page.evaluate(
                  (message, GLOBALS) => globalThis[GLOBALS.MESSAGES].next(message),
                  { id,  status: TASK_STATUS.START, message },
                  GLOBALS
                )
              )
              |> combineLatest(pageMessages, (_, message) => message)
              |> filter(({ id: _id }) => _id === id)
              |> takeUntil(
                pageMessages
                |> filter(({ status }) => status === TASK_STATUS.END)
              )
              |> map(({ message }) => message)
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
