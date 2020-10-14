
import { Subject, of, empty, concat, from } from 'rxjs'
import { mergeMap, map, tap, finalize, shareReplay, filter, combineLatest, takeUntil, ignoreElements, take, first } from 'rxjs/operators'

import { require } from '../utils/package-manager'
import emit from '../utils/emit'
import { GLOBALS } from '../runtime'
import { TASK_STATUS } from '../core/task'
import mapFirst from '../utils/mapFirst'
import mapLast from '../utils/mapLast'


export default async () => {
  const playwright = await require('playwright', __filename)
  const browser = await playwright['chromium'].launch({
    headless: false,
    devtools: true
  })

  return (
    emit((options, func) =>
      of(func)
      |> mergeMap(async func => {
        const context = await browser.newContext()
        const page = await context.newPage()
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
                messages
                |> mapFirst(message => ({
                  ...message,
                  status: TASK_STATUS.START
                }))
                |> mapLast(message => ({
                  ...message,
                  status: TASK_STATUS.CANCEL
                }))
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
