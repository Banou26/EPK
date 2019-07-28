import { mergeScan, map, takeUntil } from 'rxjs/operators';
import { of } from 'rxjs';



export default
  (unsubscribe) =>
    // @ts-ignore
    mergeScan(([cache], testFile: TestFile) => {
      const result = of(testFile)

      return (
        // @ts-ignore
        result
        // @ts-ignore
        |> map(result => [cache, result])
        // @ts-ignore
        |> takeUntil(unsubscribe)
      )
    }, [])
    // @ts-ignore
    |> map(([, result]) => result)
