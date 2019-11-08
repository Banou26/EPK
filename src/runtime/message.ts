import { Subject } from 'rxjs'

import preAnalyze from './pre-analyze.ts'
import { TASK_TYPE } from '../core/task.ts'

export enum GLOBALS {
  MESSAGES = '__EPK_MESSAGES',
  SEND_MESSAGE = '__EPK_SEND_MESSAGE'
}

export const sendMessage = globalThis[GLOBALS.SEND_MESSAGE]

export const subject = globalThis[GLOBALS.MESSAGES] = new Subject()

subject.subscribe((message) => {
  if (message.type === TASK_TYPE.PRE_ANALYZE) preAnalyze(message)
})
