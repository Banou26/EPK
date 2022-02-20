import type { Subscriber } from 'rxjs'

import { Observable } from 'rxjs'

export default <T>(func: (observer: Subscriber<T>) => Promise<() => void | void>) =>
  new Observable<T>(observer => {
    const unsubscribe = func(observer)
    return async () => (await unsubscribe)?.()
  })
