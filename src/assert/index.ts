import PowerAssert from 'power-assert'
import { isBrowser, TESTS_METADATA } from '../utils.ts'

export const assert = PowerAssert.customize({

})

export const tests = []

export const test = (desc, func) => {
  if (typeof desc !== 'string') throw new Error('desc has to be a string')
  if (typeof func !== 'function') throw new Error('func has to be a function')
  if (tests.includes(desc)) throw new Error(`Found duplicate test description: ${desc}`)
  tests.push(desc)
}

setTimeout(_ => {
  if (isBrowser) {
    window?.[TESTS_METADATA]?.(JSON.stringify(tests))
  }
}, 0)