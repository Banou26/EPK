import { tap, first, switchMap } from 'rxjs/operators'
import { Observable } from 'rxjs'

export default task => {
  return (
    task
    |> first()
    |> switchMap(v =>
      Observable.create(observer => {
        return () => {}
      })
    )
  )
}
