import { Observable } from 'rxjs'

export default <T>(func: Function): Observable<T> =>
  Observable.create(observer => {
    const unsubscribe = func(observer)
    return async () => (await unsubscribe)?.()
  })
