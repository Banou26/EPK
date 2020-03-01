import { mergeMap, map } from 'rxjs/operators'
import { of } from 'rxjs'

export default () =>
  map(() => ({
    tests: []
  }))
