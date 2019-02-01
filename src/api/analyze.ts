import { switchMap, mergeMap, take } from 'rxjs/operators'
import { of, from, merge, Observable } from 'rxjs'
import { Context } from '../types'

export default
  switchMap((ctx: Context) =>
    merge(
      ctx
        .entryFiles
        .map(entryFile =>
          // @ts-ignore
          (ctx.pageProvider)
          // @ts-ignore
          |> switchMap(page =>
            Observable.create(observer => {
              
              return _ => {}
            }))
          // @ts-ignore
          |> take(1)
    ))