import { EPKPage } from '../platforms/chromium/types'
import stacktrace from '../stacktrace/stacktrace'
import { Hook, Test, TestRun, Group, TestOptions } from '../types'



// export let setupArray = []
// export let teardownArray = []

// export const setup = (func) => setupArray = [...setupArray, func]
// export const teardown = (func) => teardownArray = [...teardownArray, func]

// export let beforeEachArray = []
// export let afterEachArray = []

// export const beforeEach = (func) => beforeEachArray = [...beforeEachArray, func]
// export const afterEach = (func) => afterEachArray = [...afterEachArray, func]

export let hooks: Hook<true>[] = []
let currentHook: Hook<true> | undefined

export type HookFunction<T extends (...args: any[]) => any> = ((hookFunction: T) => void) & {
  each: HookFunction<T>
  // (func: (...args: unknown[]) => unknown): void
}

const makeHook = <T extends (...args: any[]) => any>(options: Pick<Hook<true>, 'name'> & Partial<Pick<Hook<true>, 'each'>>): HookFunction<T> => {
  const hook = (func: T) => {
    const hook: Hook<true> = {
      ...options,
      function: async (...args) => {
        currentHook = hook
        const result = await func(...args)
        currentHook = undefined
        return result
      }
    }
    if (currentGroup) {
      currentGroup.hooks = [...currentGroup.hooks, hook]
    } else {
      hooks = [...hooks, hook]
    }
  }

  const variants = ['serial', 'isolate', 'only', 'skip'].map(variant => ([variant, { get: () => makeTest({ ...options, [variant]: true }) }] as const))

  return Object.defineProperties(hook, Object.fromEntries(variants)) as HookFunction<T>
}

export const setup = makeHook<() => (() => void) | undefined | void>({ name: 'setup' })
export const teardown = makeHook<() => void>({ name: 'teardown' })

export let groups: Group<true>[] = []
let currentGroup: Group<true> | undefined

export type UseEvaluate<T = any, T2 = any> = ({
  getPage,
  run,
  prepareContext
}: {
  getPage: () => Promise<{ page: EPKPage, tabId: number, backgroundPage: EPKPage }>
  run: (ctx: { page: EPKPage, tabId: number, backgroundPage: EPKPage }, data: any) => any,
  prepareContext: (options: { page: EPKPage, tabId?: number, backgroundPage?: EPKPage }) => Promise<void>
}, args: T) => T2

export type GroupFunction = {
  skip: GroupFunction
  only: GroupFunction
  use: <T extends any, T2 extends any>(func: UseEvaluate<T, T2>, args: T) => GroupFunction
  (name: string, func: (...args: unknown[]) => unknown): void
}

const makeGroup = (options = {}): GroupFunction => {
  const group = (name: string, func: (...args) => any) => {
    const group: Group<true> = {
      ...options,
      name,
      function: (...args) => {
        currentGroup = group
        func(...args)
        currentGroup = undefined
      },
      hooks: [],
      tests: []
    }
    groups = [...groups, group]
  }

  const variants = ['serial', 'isolate', 'only', 'skip'].map(variant => ([variant, { get: () => makeTest({ ...options, [variant]: true }) }] as const))

  return Object.defineProperties(group, Object.fromEntries([
    ...variants,
    ['use', { get: () => (func: (...args) => any, args: any[]) => makeGroup({ ...options, useFunction: func.toString(), useArguments: args }) }]
  ])) as GroupFunction
}

export const group = makeGroup()

export let tests: Test<true>[] = []

export type TestFunction = {
  skip: TestFunction
  only: TestFunction
  (name: string, func: (...args: unknown[]) => unknown): void
}

const makeTest = (options: TestOptions = {}): TestFunction => {
  const test = (name: string, func: (...args) => any) => {
    const test: Test<true> = {
      ...options,
      name,
      function: async (args): Promise<TestRun> => {
        if (options.skip) {
          return {
            test: { ...test, function: func.toString() } as unknown as Test<false>,
            function: func.toString(),
            status: 'skip',
            return: undefined
          }
        }
        try {
          return {
            test: { ...test, function: func.toString() } as unknown as Test<false>,
            function: func.toString(),
            status: 'success',
            return: await func(args)
          }
        } catch (err: any) {
          try {
            const stack = await stacktrace.fromError(err)
            return {
              test: { ...test, function: func.toString() } as unknown as Test<false>,
              function: func.toString(),
              status: 'fail',
              originalStack: err.stack,
              errorStack: stack as string[]
            }
          } catch (_) {
            return {
              test: { ...test, function: func.toString() } as unknown as Test<false>,
              function: func.toString(),
              status: 'fail',
              originalStack: err.stack
            }
          }
        }
      }
    }
    if (currentGroup) {
      currentGroup.tests = [...currentGroup.tests, test]
    } else {
      tests = [...tests, test]
    }
  }

  const variants = ['serial', 'isolate', 'only', 'skip'].map(variant => ([variant, { get: () => makeTest({ ...options, [variant]: true }) }]))

  return Object.defineProperties(test, Object.fromEntries(variants)) as TestFunction
}

export const test = makeTest()
