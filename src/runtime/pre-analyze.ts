import { of } from 'rxjs'
import { mergeMap } from 'rxjs/operators'

import { tests } from './test.ts'

export default () =>
  // todo: replace the async function by a rxjs `of` when https://github.com/parcel-bundler/parcel/issues/3690 is fixed
  mergeMap(async ({ id, ...rest }) => {
    const result = tests.map(({ name, function: func, isolate, serial }) => ({
      name,
      function: func.toString(),
      async: func.constructor.name === 'AsyncFunction',
      argsLength: func.length,
      isolate: !!isolate,
      serial: !!serial
    }))
    console.log('PRE ANALYZE', rest, tests, result)
    return {
      tests: result
    }
  })