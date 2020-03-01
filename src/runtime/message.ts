import { Subject } from 'rxjs'

import preAnalyze from './pre-analyze.ts'
import { TASK_TYPE, TASK_STATUS } from '../core/task.ts'
import { groupBy, tap, mergeMap, first, startWith, takeUntil, filter, finalize, map, delay, skip } from 'rxjs/operators'
import run from './run.ts'
import mapLast from '../utils/mapLast.ts'

export enum GLOBALS {
  MESSAGES = '__EPK_MESSAGES__',
  SEND_MESSAGE = '__EPK_SEND_MESSAGE__'
}

const taskMap = new Map([
  [TASK_TYPE.PRE_ANALYZE, preAnalyze],
  [TASK_TYPE.RUN, run]
])

export const sendMessage = (value) => console.log('sent', value) || globalThis[GLOBALS.SEND_MESSAGE](value)

export const subject = globalThis[GLOBALS.MESSAGES] = new Subject()

const incomingMessages =
  subject
  |> tap(v => console.log('received', v))
  |> groupBy(({ id }) => id)
  |> mergeMap(messages =>
    messages
    |> takeUntil(
      messages
      |> filter(({ status }) => status === TASK_STATUS.CANCEL)
      |> tap(() => console.log('CANCELLED', messages.key) || (cancelled = true))
    )
    |> first(({ message: { type } = {} } = {}) => type)
    |> tap(() => console.log('hmm', messages.key))
    |> mergeMap(task => {
      let cancelled = false
      return (
        messages
        |> startWith(task)
        |> map(({ message }) => message)
        |> taskMap.get(task.message.type)()
        |> mapLast(message => ({
          ...message,
          status: TASK_STATUS.END
        }))
        |> tap(message =>
          sendMessage({
            id: messages.key,
            message
          })
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

incomingMessages.subscribe()
