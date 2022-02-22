import type { Event } from '../utils/runtime'


import { tests } from './test'
import asyncObservable from 'src/utils/async-observable'

export default () =>
  asyncObservable<Event<'register'>>(async (observer) => {
    // todo: wait for tests to register via esbuild inject
    observer.next({ type: 'register', data: { tests } })
  })
