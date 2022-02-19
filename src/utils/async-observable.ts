import { Observable } from 'rxjs'

export default <T>(func: Function): Observable<T> =>
  new Observable(observer => {
    const unsubscribe = func(observer)
    return async () => (await unsubscribe)?.()
  })
