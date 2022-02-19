import { Observable } from 'rxjs';

export default <T>(value: T) =>
  new Observable<T>(observer => observer.next(value))