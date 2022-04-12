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

const _initDone = globalThis[toGlobal('initDone')]
let isContextScript = false
globalThis[toGlobal('initDone')] = (args) => {
  done.next()
  if (args?.environment === 'content-script') {
    isContextScript = true
    window.postMessage({ __epk__: true, name: 'initDone' }, '*')
  } else {
    _initDone()
  }
}

export const sendMessage = (value) =>
  isContextScript
    ? window.postMessage({ __epk__: true, name: 'event', value: JSON.stringify(value) }, '*')
    : globalThis[toGlobal('event')](value)

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
