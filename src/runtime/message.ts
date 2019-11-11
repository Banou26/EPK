import { Subject } from 'rxjs'

import preAnalyze from './pre-analyze.ts'
import { TASK_TYPE, TASK_STATUS } from '../core/task.ts'
import { groupBy, tap, mergeMap, first, startWith, takeUntil, filter, finalize } from 'rxjs/operators'

export enum GLOBALS {
  MESSAGES = '__EPK_MESSAGES__',
  SEND_MESSAGE = '__EPK_SEND_MESSAGE__'
}

const taskMap = new Map([
  [TASK_TYPE.PRE_ANALYZE, preAnalyze]
])

export const sendMessage = (...args) => console.log('msg', ...args) || globalThis[GLOBALS.SEND_MESSAGE](...args)

export const subject = globalThis[GLOBALS.MESSAGES] = new Subject()

const incomingMessages =
  subject
  |> tap(v => console.log('lul', v))
  |> groupBy(({ id }) => id)
  |> mergeMap(messages =>
    messages
    |> tap(v => console.log('hmm', v))
    |> first()
    |> mergeMap(task => 
      messages
      |> startWith(task)
      |> takeUntil(
        messages
        |> filter(({ status }) => status === TASK_STATUS.CANCEL)
      )
      |> tap(v => console.log('ooo', v))
      |> taskMap.get(task.type)()
      |> tap(v => console.log('aaaa', v))
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

incomingMessages.subscribe()
