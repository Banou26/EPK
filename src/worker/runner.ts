import { tap } from 'rxjs/operators';

export default task => {
  return (
    task
    |> tap(v => console.log(v))
  )
}
