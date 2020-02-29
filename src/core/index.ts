import { tap } from 'rxjs/operators'

import Parcel from './parcel.ts'

export default options =>
  Parcel(options)
  |> tap(v => console.log(v))
