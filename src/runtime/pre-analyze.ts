import { of } from 'rxjs'
import { map } from 'rxjs/operators'

import { tests } from './test'

export default () =>
  map(() => ({
    tests:
      tests.map(({ name, function: func, isolate, serial }) => ({
        name,
        function: func.toString(),
        async: func.constructor.name === 'AsyncFunction',
        argsLength: func.length,
        isolate: !!isolate,
        serial: !!serial
      }))
  }))
