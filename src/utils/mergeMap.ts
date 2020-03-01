import { mergeMap } from 'rxjs/operators'
import { isObservable, from, of } from 'rxjs'

export default (project, resultSelector, concurrent) =>
  mergeMap(
    (...args) => {
      const result = project(...args)

      return (
        result instanceof Promise
          ? from(result) |> mergeMap(obs => obs)
          : result
      )
    },
    resultSelector,
    concurrent
  )
