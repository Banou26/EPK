import { merge } from 'rxjs'
import { last, tap, map, ignoreElements } from 'rxjs/operators'

export default
  mapFunction =>
    observable => {
      let lastEmitted = false
      let lastValue
      const lastStream =
        observable
        |> last()
        |> tap(value => {
          lastEmitted = true
          lastValue = mapFunction(value)
        })
        |> ignoreElements()

      const stream =
        observable
        |> map(value =>
          lastEmitted
              ? lastValue
              : value
        )

      return merge(
        lastStream,
        stream
      )
    }
