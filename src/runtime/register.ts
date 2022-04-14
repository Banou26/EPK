import type { Event } from '../utils/runtime'


import { tests, groups } from './test'
import asyncObservable from '../utils/async-observable'

export default () =>
  asyncObservable<Event<'register'>>(async (observer) => {
    // todo: wait for tests to register via esbuild inject
    // register tests inside groups
    groups.map(group => group.function({}))
    observer.next({ type: 'register', data: { tests, groups } })
  })
