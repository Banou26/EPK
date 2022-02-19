
import { Subject, of, empty, concat, from } from 'rxjs'
import { mergeMap, map, tap, finalize, shareReplay, filter, combineLatest, takeUntil, ignoreElements, take, first } from 'rxjs/operators'

import playwright from 'playwright'
// import { require } from '../utils/package-manager'
import emit from '../utils/emit'
import { GLOBALS } from '../runtime'
import { TASK_STATUS } from '../core/task'
import mapFirst from '../utils/mapFirst'
import mapLast from '../utils/mapLast'
import { toGlobal } from '../utils/runtime-globals'

export default async () => {
  // const playwright = await require('playwright', __filename)
  const browser = await playwright['chromium'].launch({
    headless: false,
    devtools: true
  })

  return (
    emit((options, func) =>
      of(func)
      .pipe(
        mergeMap(async func => {
          const context = await browser.newContext()
          const page = await context.newPage()
          const pageMessages = new Subject()
          const cancelledTasks = []
  
          await page.addScriptTag({ path: options.filePath })
          await page.exposeFunction(toGlobal('sendMessage'), msg => pageMessages.next(msg))
  
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
                    .pipe(
                      tap(val => console.log('tap val', val)),
                      mapFirst(message => ({
                        ...message,
                        status: TASK_STATUS.START
                      })),
                      mapLast(message => ({
                        ...message,
                        status: TASK_STATUS.CANCEL
                      })),
                      // tap(val => console.log('tap val', val)),
                      mergeMap(async message => {
                        if (JSCoverage) {
                          if (coverageRunning) {
                            throw new Error('Tried to start a JS Coverage on a page that is already running a JS Coverage.')
                          }
                          await page.coverage.startJSCoverage()
                          coverageRunning = true
                        }
                        return message
                      }),
                      mergeMap(async message => {
                        await page.evaluate(
                          (message, globalVariableName) => globalThis[globalVariableName].next(message),
                          { id, message },
                          toGlobal('messages')
                        )
                        return message
                      }),
                      combineLatest(pageMessages, (_, message) => message),
                      filter(({ id: _id }) => _id === id),
                      takeUntil(
                        pageMessages
                        .pipe(
                          filter(({ status }) => status === TASK_STATUS.END),
                          tap(() => (taskFinished = true))
                        )

                      ),
                      map(({ message }) => message)
                    ),

                  JSCoverage
                    ? (
                      from(page.coverage.stopJSCoverage())
                        .pipe(
                          finalize(() => (coverageRunning = false))
                        )
                    )
                    : empty()
                )
            })
            .pipe(
              finalize(() =>
                Promise
                  .all(cancelledTasks)
                  .then(() => page.close())
              )
            )
          )
        }),
        mergeMap(obs => obs)
      )
    )
    .pipe(
      finalize(() => browser.close())
    )
  )
}
