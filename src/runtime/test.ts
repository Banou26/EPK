
export let tests = []

export const test = (name: string, func: (...args) => any, params?: any) => {
  tests = [
    ...tests,
    {
      name,
      function: func,
      ...params
    }
  ]
}

test.serial = (name, func) => test(name, func, { serial: true })
test.isolate = (name, func) => test(name, func, { isolate: true })

export let beforeArray = []
export let afterArray = []

export const beforeAll = (func) => beforeArray = [...beforeArray, func]
export const afterAll = (func) => afterArray = [...afterArray, func]

export let beforeEachArray = []
export let afterEachArray = []

export const beforeEach = (func) => beforeEachArray = [...beforeEachArray, func]
export const afterEach = (func) => afterEachArray = [...afterEachArray, func]
