import { merge } from 'rxjs'
import { first, tap, map, ignoreElements } from 'rxjs/operators'

export default
  mapFunction =>
    map((value, i) =>
      i === 0
        ? mapFunction(value)
        : value
    )