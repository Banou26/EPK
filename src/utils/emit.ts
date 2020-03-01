import { Observable } from 'rxjs';

export default value =>
  Observable.create(observer => observer.next(value))