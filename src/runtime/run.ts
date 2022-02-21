import type { Event, Task } from '../utils/runtime'

import { tests as registeredTests } from './test'
import asyncObservable from 'src/utils/async-observable'

export default ({ tests }: Task<'run'>['data']) =>
  asyncObservable<Event<'run' | 'runs'>>(async (observer) => {
    const results = await Promise.all(
      tests.map(test =>
        registeredTests
          .find(({ name }) => name === test.name)
          .function()
          .then(val => {
            observer.next({ type: 'run', data: { test: val } })
            return val
          })
      )
    )
    observer.next({ type: 'runs', data: { tests: results } })
  })
