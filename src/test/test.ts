import { isBrowser, GET_TESTS, RUN_TEST } from '../utils'
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

if (isBrowser) {
  window.addEventListener('message', async ({ data: { name, data } }) => {
    if (name === GET_TESTS) {
      window.parent
        .postMessage({
          name: GET_TESTS,
          errors,
          data:
            Array.from(tests)
              .map(([desc, func]) => [desc, func.toString()])
        }, '*')
    } else if (name === RUN_TEST) {
      let error
      try {
        const result = await tests.get(data)()
        // console.log(result)
        // if (result instanceof Error) error = result
      } catch (err) {
        // console.log(err)
        error = err
      }
      
      //   .then(result => console.log('result', result)).catch(err => console.log('error', err))
      // setTimeout(_ => console.log(errors), 0)
      window.parent
        .postMessage({
          name: GET_TESTS,
          data: {
            error
            // ...await tests.get(data)()
            //   .then(value => ({ /*value*/ }))
            //   .catch(error => console.log('lol', error) || ({ error }))
          }
        }, '*')
    }
  })
}