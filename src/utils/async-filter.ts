import { mergeMap } from 'rxjs/operators'
import asyncObservable from './async-observable.ts'

export default mergeMap(_value =>
  asyncObservable(async observer => {
    const value = await _value
    if (value) observer.next(value)
  }))