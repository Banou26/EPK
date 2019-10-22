import { Observable, Subject, ReplaySubject } from 'rxjs'
import { pluck, filter } from 'rxjs/operators'

import isBrowser from '../utils/isBrowser.ts'
import browserWorkerFarm from './browser.ts'
import nodeWorkerFarm from './node.ts'

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
      (queue
      |> filter(([_id]) => _id === id)
      |> pluck(1))

    result.subscribe(replay)

    taskSubject.next(messageObservable)
    return replay
  }
}
