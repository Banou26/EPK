import type { Event, Task } from '../utils/runtime'

import { describes as registeredDescribes, tests as registeredTests } from './test'
import asyncObservable from 'src/utils/async-observable'

export default ({ describes, tests }: Task<'run'>['data']) =>
  asyncObservable<Event<'run' | 'runs'>>(async (observer) => {
    // register tests inside describes
    registeredDescribes.map(describe => describe.function())

    const describesResults = await Promise.all(
      describes.map(async describe => ({
        ...describe,
        tests: await Promise.all(
          describe.tests.map(test =>
            registeredDescribes
              .find(({ name }) => name === describe.name)
              .tests
              .find(({ name }) => name === test.name)
              .function()
              .then(val => {
                observer.next({ type: 'run', data: { test: val } })
                return val
              })
          )
        )
      }))
    )

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

    observer.next({ type: 'runs', data: { describes: describesResults, tests: results } })
  })
