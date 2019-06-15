import { isObservable } from 'rxjs'
import { toArray, filter } from 'rxjs/operators'

import { MESSAGE } from '../types.ts'

import { inMessages, outMessages } from './utils.ts'

export const tests = new Map<string, Function>()

export const todo = _ => {}
export const pass = _ => {}
export const fail = _ => {}

export const test = (desc, func) => {
  if (typeof desc !== 'string') throw new TypeError('desc has to be a string')
  if (typeof func !== 'function') throw new TypeError('func has to be a function')
  if (tests.has(desc)) throw new Error(`Found duplicate test description: ${desc}`)
  tests.set(desc, func)
}

const getTests = () =>
  outMessages.next({
    type: MESSAGE.GET_TESTS_RESPONSE,
    tests:
      Array
        .from(tests)
        .map(([description, func]) => ({
          description,
          body: func.toString()
        }))
  })

const runTest = async ({ description }) => {
  // Empty the logs
  // logs.splice(0, logs.length)

  // todo: replace by "isBrowser ? window : require('perf_hooks')"
  const { performance } = window
  let executionStart, executionEnd, value

  try {
    executionStart = performance.now()
    value = await tests.get(description)()
    if (isObservable(value)) {
      // @ts-ignore
      value = await (value |> toArray()).toPromise()
    }
  } finally {
    executionEnd = performance.now()

    setTimeout(() =>
      outMessages.next({
        type: MESSAGE.RUN_TEST_RESPONSE,
        test: {
          executionStart,
          executionEnd,
          type:
            isObservable(value) ? 'observable'
              : value instanceof Promise ? 'promise'
              : 'function',
          value
        }
      }), 0)
  }
}

const messagesMap = new Map<MESSAGE, (...args) => any>([
  [MESSAGE.GET_TESTS, getTests],
  [MESSAGE.RUN_TEST, runTest]
])

const messages =
  inMessages
  // @ts-ignore
  |> filter(({ type }) => type in MESSAGE)

// @ts-ignore
messages.subscribe(({ type, ...rest }) =>
  messagesMap.get(type)({ type, ...rest }))
