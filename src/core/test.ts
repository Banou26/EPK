import { switchMap, mergeMap, take } from 'rxjs/operators'

export default
  (targetRuntimeProvider, options) =>
    switchMap(file =>
      // @ts-ignore
      targetRuntimeProvider
      // @ts-ignore
      |> mergeMap(async targetRuntime => {
        return file
      })
      // @ts-ignore
      |> take(1))
