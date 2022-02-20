import { Subject } from 'rxjs'

import { tap, mergeMap } from 'rxjs/operators'
import register from './register'
import run from './run'
import { toGlobal, Task, TASK } from '../utils/runtime'

const resolvers = {
  register,
  run
} as const

export const sendMessage = (value) => globalThis[toGlobal('sendMessage')](value)

export const subject = globalThis[toGlobal('messages')] = new Subject<Task<TASK>>()

const incomingMessages =
  subject
    .pipe(
      tap(v => console.log('received', v)),
      mergeMap(message => resolvers[message.type]()),
      tap(event => void console.log('sending', event) || sendMessage(event))
    )

incomingMessages.subscribe()
