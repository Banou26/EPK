import { Subject } from 'rxjs'

import preAnalyze from './pre-analyze.ts'
import { TASK_TYPE, TASK_STATUS } from '../core/task.ts'
import { groupBy, tap, mergeMap, first, startWith, takeUntil, filter, finalize, map, delay } from 'rxjs/operators'
import run from './run.ts'

export enum GLOBALS {
  MESSAGES = '__EPK_MESSAGES__',
  SEND_MESSAGE = '__EPK_SEND_MESSAGE__'
}

const taskMap = new Map([
  [TASK_TYPE.PRE_ANALYZE, preAnalyze],
  [TASK_TYPE.RUN, run]
])

export const sendMessage = (value) => globalThis[GLOBALS.SEND_MESSAGE](value)

export const subject = globalThis[GLOBALS.MESSAGES] = new Subject()

const incomingMessages =
  subject
  |> groupBy(({ id }) => id)
  |> mergeMap(messages =>
    messages
    |> first()
    |> mergeMap(task =>
      messages
      |> startWith(task)
      |> takeUntil(
        messages
        |> filter(({ status }) => status === TASK_STATUS.CANCEL)
      )
      |> map(({ message }) => message)
      |> taskMap.get(task.message.type)()
      |> tap(message =>
        sendMessage({
          id: messages.key,
          message
        })
      )
      |> finalize(() =>
        sendMessage({
          id: messages.key,
          status: TASK_STATUS.END
        })
      )
    )
  )

incomingMessages.subscribe(() => {})
