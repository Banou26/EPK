import { Observable, Subject, ReplaySubject, pipe } from 'rxjs'
import { pluck, filter } from 'rxjs/operators'

import isBrowser from '../utils/isBrowser'
import browserWorkerFarm from './browser'
import nodeWorkerFarm from './node'

export default () => {
  const taskSubject = new Subject()

  const queue =
    isBrowser
      ? browserWorkerFarm(taskSubject)
      : nodeWorkerFarm(taskSubject)

  let idCounter = 0
  return messageObservable => {
    const replay = new ReplaySubject()
    const id = idCounter
    idCounter++

    const result =
      queue.pipe(
        filter(([_id]) => _id === id),
        pluck(1)
      )


    result.subscribe(replay)

    taskSubject.next(messageObservable)
    return replay
  }
}
