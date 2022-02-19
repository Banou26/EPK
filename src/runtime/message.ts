import { Subject } from 'rxjs'

import preAnalyze from './pre-analyze'
import { TASK_TYPE, TASK_STATUS } from '../core/task'
import { groupBy, tap, mergeMap, first, startWith, takeUntil, filter, finalize, map, delay, skip } from 'rxjs/operators'
import run from './run'
import mapLast from '../utils/mapLast'
import { toGlobal } from '../utils/runtime-globals'

const taskMap = new Map([
  [TASK_TYPE.PRE_ANALYZE, preAnalyze],
  [TASK_TYPE.RUN, run]
])

export const sendMessage = (value) => console.log('sent', value) || globalThis[toGlobal('sendMessage')](value)

export const subject = globalThis[toGlobal('messages')] = new Subject()

const incomingMessages =
  subject
    .pipe(
      tap(v => console.log('received', v)),
      groupBy(({ id }) => id),
      mergeMap(messages =>
        messages
          .pipe(
            takeUntil(
              messages
                .pipe(
                  filter(({ status }) => status === TASK_STATUS.CANCEL),
                  tap(() => console.log('CANCELLED', messages.key) || (cancelled = true))
                )
            ),
            first(({ message: { type } = {} } = {}) => type),
            tap(() => console.log('hmm', messages.key)),
            mergeMap(task => {
              let cancelled = false
              return (
                messages
                  .pipe(
                    startWith(task),
                    map(({ message }) => message),
                    taskMap.get(task.message.type)(),
                    mapLast(message => ({
                      ...message,
                      status: TASK_STATUS.END
                    })),
                    tap(message =>
                      sendMessage({
                        id: messages.key,
                        message
                      })
                    )
                  )

                // |> finalize(() =>
                //   !cancelled
                //   && sendMessage({
                //     id: messages.key,
                //     status: TASK_STATUS.END
                //   })
                // )
              )
            })
          )
      )
    )

incomingMessages.subscribe()
