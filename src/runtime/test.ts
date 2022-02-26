import stacktrace from '../stracktrace/stacktrace'
import { Test, TestRun } from '../types'

export let tests: Test[] = []

const makeTest = (options = {}) => {
  const test = (name: string, func: (...args) => any) => {
    const test = {
      name,
      function: async (args): Promise<TestRun> => {
        try {
          return { test, status: 'success', return: await func(args) }
        } catch (err: any) {
          try {
            const stack = await stacktrace.fromError(err)
            return { test, status: 'fail', originalStack: err.stack, errorStack: stack }
          } catch (_) {
            return { test, status: 'fail', originalStack: err.stack }
          }
        }
      }
    }
    tests = [...tests, test]
  }

  const variants = ['serial', 'isolate', 'only', 'skip'].map(variant => ([variant, { get: () => makeTest({ ...options, [variant]: true }) }]))

  return Object.defineProperties(test, Object.fromEntries(variants))
}

export const test = makeTest()

export let beforeArray = []
export let afterArray = []

export const beforeAll = (func) => beforeArray = [...beforeArray, func]
export const afterAll = (func) => afterArray = [...afterArray, func]

export let beforeEachArray = []
export let afterEachArray = []

export const beforeEach = (func) => beforeEachArray = [...beforeEachArray, func]
export const afterEach = (func) => afterEachArray = [...afterEachArray, func]
