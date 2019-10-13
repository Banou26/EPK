import { tap } from 'rxjs/operators'
import { isObservable } from 'rxjs'

export default (...args) =>
  isObservable(args[0])
    ? tap(value => args[0](value).subscribe())
    : tap(...args)
