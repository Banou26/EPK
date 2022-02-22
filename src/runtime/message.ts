import { from, Observable, of, ReplaySubject, Subject } from 'rxjs'

import { tap, mergeMap, buffer, windowToggle, mapTo } from 'rxjs/operators'
import register from './register'
import run from './run'
import { toGlobal, Task, TASK } from '../utils/runtime'

const resolvers = {
  register,
  run
} as const

const done = new ReplaySubject()

globalThis[toGlobal('initDone')] = () => {
  done.next()
}

export const sendMessage = (value) => globalThis[toGlobal('event')](value)

export const subject = globalThis[toGlobal('task')] = new Subject<Task<TASK>>()

const incomingMessages =
  subject
    .pipe(
      mergeMap(val => done.pipe(mapTo(val))),
      // tap(v => console.log('received', v)),
      mergeMap(message => resolvers[message.type](message.data)),
      // tap(v => void console.log('sending', v)),
      tap(event => sendMessage(event))
    )

incomingMessages.subscribe()
