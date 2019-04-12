import { EventEmitter } from 'events'

import { stringify } from 'flatted/cjs'
import { isObservable } from 'rxjs'
import { toArray } from 'rxjs/operators'

import { isBrowser } from '../core/utils.ts'
import { MESSAGE_TYPE, NODE_GLOBAL } from '../types.ts'
import { logs } from './logging.ts'

export const tests = new Map<string, Function>()

export const todo = _ => {}
export const pass = _ => {}
export const fail = _ => {}

export const test = (desc, func) => {
  if (typeof desc !== 'string') throw new Error('desc has to be a string')
  if (typeof func !== 'function') throw new Error('func has to be a function')
  if (tests.has(desc)) throw new Error(`Found duplicate test description: ${desc}`)
  tests.set(desc, func)
}

const emit = (type, data) =>
  isBrowser
    ? window.parent.postMessage({ type, logs, data }, '*')
    : global[NODE_GLOBAL].emit('message', { type, logs, data })

const getTests = () =>
  emit(
    MESSAGE_TYPE.GET_TESTS_RESPONSE,
    Array
      .from(tests)
      .map(([description, func]) => ({
        description,
        body: func.toString()
      }))
  )

const runTest = async description => {
  // Empty the logs
  // logs.splice(0, logs.length)

  // todo: replace by "isBrowser ? window : require('perf_hooks')"
  const { performance } = window
  let timeStart, timeEnd, value

  try {
    timeStart = performance.now()
    value = await tests.get(description)()
    if (isObservable(value)) {
      // @ts-ignore
      value = await (value |> toArray()).toPromise()
    }
  } finally {
    timeEnd = performance.now()

    setTimeout(() =>
      emit(
        MESSAGE_TYPE.RUN_TEST_RESPONSE,
        {
          timeStart,
          timeEnd,
          type:
            isObservable(value) ? 'observable'
              : value instanceof Promise ? 'promise'
              : 'function',
          value: stringify(value),
          logs
        }
      ))
  }
}

const newEvent = ({ data: { type, description } }) => {
  if (type === MESSAGE_TYPE.GET_TESTS) getTests()
  if (type === MESSAGE_TYPE.RUN_TEST) runTest(description)
}

if (isBrowser) {
  window.addEventListener('message', newEvent)
} else {
  const events = global[NODE_GLOBAL] = new EventEmitter()
  events.addListener('message', newEvent)
}
