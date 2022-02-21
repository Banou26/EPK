import stacktrace from '../stracktrace/stacktrace'
import { Test, TestRun } from '../types'

export let tests: Test[] = []

export const test = (name: string, func: (...args) => any) => {
  const test = {
    name,
    function: async (args): Promise<TestRun> => {
      try {
        return { test, return: await func(args) }
      } catch (err: any) {
        try {
          const stack = await stacktrace.fromError(err)
          return { test, originalStack: err.stack, errorStack: stack }
        } catch (_) {
          return { test, originalStack: err.stack }
        }
      }
    }
  }
  tests = [...tests, test]
}

// test.serial = (name, func) => test(name, func, { serial: true })
// test.isolate = (name, func) => test(name, func, { isolate: true })

export let beforeArray = []
export let afterArray = []

export const beforeAll = (func) => beforeArray = [...beforeArray, func]
export const afterAll = (func) => afterArray = [...afterArray, func]

export let beforeEachArray = []
export let afterEachArray = []

export const beforeEach = (func) => beforeEachArray = [...beforeEachArray, func]
export const afterEach = (func) => afterEachArray = [...afterEachArray, func]
