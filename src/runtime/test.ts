
export const tests = []

export const test = (name, func, params) =>
  tests.push({
    name,
    function: func,
    ...params
  })

test.serial = (name, func) => test(name, func, { serial: true })
test.isolate = (name, func) => test(name, func, { isolate: true })

export const beforeArray = []
export const afterArray = []

export const before = (func) => beforeArray.push(func)
export const after = (func) => afterArray.push(func)


export const beforeEachArray = []
export const afterEachArray = []

export const beforeEach = (func) => beforeEachArray.push(func)
export const afterEach = (func) => afterEachArray.push(func)