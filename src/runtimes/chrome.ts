
import { Subject, of, empty, concat, from } from 'rxjs'
import { map, tap, finalize, shareReplay, filter, combineLatest, takeUntil, ignoreElements } from 'rxjs/operators'

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
        await page.exposeFunction(GLOBALS.SEND_MESSAGE, msg => pageMessages.next(msg))

        let coverageRunning = false
        let count = 0
        return (
          func(({ JSCoverage = false } = {}) => {
            const id = count
            count++
            let taskFinished = false
            
            return messages =>
              concat(
                from(
                  page.evaluate(
                    (message, GLOBALS) => globalThis[GLOBALS.MESSAGES].next(message),
                    { id, status: TASK_STATUS.START },
                    GLOBALS
                  )
                )
                |> ignoreElements(),

                messages
                |> finalize(() =>
                  !taskFinished
                  && page.evaluate(
                    (message, GLOBALS) => globalThis[GLOBALS.MESSAGES].next(message),
                    { id, status: TASK_STATUS.CANCEL },
                    GLOBALS
                  )
                )
                |> mergeMap(async message => {
                  if (JSCoverage) {
                    if (coverageRunning) {
                      throw new Error('Tried to start a JS Coverage on a page that is already running a JS Coverage.')
                    }
                    await page.coverage.startJSCoverage()
                    coverageRunning = true
                  }
                  return message
                })
                |> tap(message =>
                  page.evaluate(
                    (message, GLOBALS) => globalThis[GLOBALS.MESSAGES].next(message),
                    { id, message },
                    GLOBALS
                  )
                )
                |> combineLatest(pageMessages, (_, message) => message)
                |> filter(({ id: _id }) => _id === id)
                |> takeUntil(
                  pageMessages
                  |> filter(({ status }) => status === TASK_STATUS.END)
                  |> tap(() => (taskFinished = true))
                )
                |> map(({ message }) => message),

                JSCoverage
                  ? from(page.coverage.stopJSCoverage())
                    |> finalize(() => (coverageRunning = false))
                  : empty()
              )
          })
          |> finalize(() => page.close())
        )
      })
    )
    |> finalize(() => browser.close())
  )
}
