import stacktrace from '../stracktrace/stacktrace'
import { Test, TestRun, Describe } from '../types'

let currentDescribe: Describe | undefined

export let describes: Describe[] = []

const makeDescribe = (options = {}) => {
  const describe = (name: string, func: (...args) => any) => {
    const describe = {
      ...options,
      name,
      function: (...args) => {
        currentDescribe = describe
        func(...args)
        currentDescribe = undefined
      },
      tests: []
    }
    describes = [...describes, describe]
  }

  const variants = ['serial', 'isolate', 'only', 'skip'].map(variant => ([variant, { get: () => makeTest({ ...options, [variant]: true }) }] as const))

  return Object.defineProperties(describe, Object.fromEntries([
    ...variants,
    ['with', { get: () => (func: (...args) => any, args: any[]) => makeDescribe({ ...options, withFunction: func, withArguments: args }) }]
  ]))
}

export const describe = makeDescribe()

export let tests: Test[] = []

const makeTest = (options = {}) => {
  const test = (name: string, func: (...args) => any) => {
    const test = {
      ...options,
      name,
      function: async (args): Promise<TestRun> => {
        try {
          return { test, function: func.toString(), status: 'success', return: await func(args) }
        } catch (err: any) {
          try {
            const stack = await stacktrace.fromError(err)
            return { test, function: func.toString(), status: 'fail', originalStack: err.stack, errorStack: stack as string[] }
          } catch (_) {
            return { test, function: func.toString(), status: 'fail', originalStack: err.stack }
          }
        }
      }
    }
    if (currentDescribe) {
      currentDescribe.tests = [...currentDescribe.tests, test]
    } else {
      tests = [...tests, test]
    }
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
