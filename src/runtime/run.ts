import type { Event } from '../utils/runtime'


import { tests } from '.'
import asyncObservable from 'src/utils/async-observable'

export default () =>
  asyncObservable<Event<'run' | 'runs'>>(async (observer) => {
    // observer.next({ type: 'run', data: { test: } })
  })
