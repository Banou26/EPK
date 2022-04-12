import type { Event } from '../utils/runtime'


import { tests, describes } from './test'
import asyncObservable from '../utils/async-observable'

export default () =>
  asyncObservable<Event<'register'>>(async (observer) => {
    // todo: wait for tests to register via esbuild inject
    // register tests inside describes
    describes.map(describe => describe.function({}))
    observer.next({ type: 'register', data: { tests, describes } })
  })
