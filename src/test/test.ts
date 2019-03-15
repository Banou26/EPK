import { EventEmitter } from 'events'
import { stringify } from 'flatted/cjs'
import { isBrowser } from '../core/utils'
import { File, Test, TestResult, MESSAGE_TYPE, NODE_GLOBAL } from '../types'
import { errors } from './error'

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

const initiated = new Promise(resolve => setTimeout(resolve, 0))

const emit = (type, data) =>
  isBrowser
    ? window.parent.postMessage({ type, errors, data }, '*')
    : global[NODE_GLOBAL].emit('message', { type, errors, data })

const getTests = () =>
  emit(
    MESSAGE_TYPE.GET_TESTS_RESPONSE,
    Array
      .from(tests)
      .map(([desc, func]) => [
        desc,
        func.toString()
      ])
  )

const runTest = async description => {
  // todo: replace by "isBrowser ? window : require('perf_hooks')"
  const { performance } = window
  let timeStart, timeEnd, data, error

  try {
    timeStart = performance.now()
    data = stringify(await tests.get(description)())
    timeEnd = performance.now()
  } catch (err) {
    error = err
  }

  emit(
    MESSAGE_TYPE.RUN_TEST_RESPONSE,
    {
      timeStart,
      timeEnd,
      data,
      error: error && {
        name: error.name,
        message: error.message
      }
    }
  )
}

const newEvent = ({ data: { type, description } }) =>
    type === MESSAGE_TYPE.GET_TESTS ? getTests()
  : type === MESSAGE_TYPE.RUN_TEST && runTest(description)

if (isBrowser) {
  window.addEventListener('message', newEvent)
} else {
  const events = global[NODE_GLOBAL] = new EventEmitter()
  events.addListener('message', newEvent)
}

// const addEventListener =
//   isBrowser
//     ? window.addEventListener
//     : global[NODE_GLOBAL].addListener

// addEventListener('message', ({ data: { type, description } }) =>
//     type === MESSAGE_TYPE.GET_TESTS ? getTests()
//   : type === MESSAGE_TYPE.RUN_TEST && runTest(description))

