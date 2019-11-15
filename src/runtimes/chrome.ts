
import { Subject, of, empty, concat, from } from 'rxjs'
import { mergeMap, map, tap, finalize, shareReplay, filter, combineLatest, takeUntil, ignoreElements, take, first } from 'rxjs/operators'

import { require } from '../utils/package-manager.ts'
import emit from '../utils/emit.ts'
import { GLOBALS } from '../runtime/index.ts'
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
        const cancelledTasks = []

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
                  && cancelledTasks.push(
                    page.evaluate(
                      (message, GLOBALS) => globalThis[GLOBALS.MESSAGES].next(message),
                      { id, status: TASK_STATUS.CANCEL },
                      GLOBALS
                    )
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
                |> mergeMap(async message => {
                  await page.evaluate(
                    (message, GLOBALS) => globalThis[GLOBALS.MESSAGES].next(message),
                    { id, message },
                    GLOBALS
                  )
                  return message
                })
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
          |> finalize(() =>
            Promise
              .all(cancelledTasks)
              .then(() => page.close())
          )
        )
      })
      |> mergeMap(obs => obs)
    )
    |> finalize(() => browser.close())
  )
}
