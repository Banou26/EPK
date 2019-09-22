import Parcel from '../parcel/index.ts'
import { PARCEL_REPORTER_EVENT } from '../parcel/index.ts'
import WorkerFarm from './workerFarm.ts'

export default (parcelOptions) => {

  const workerFarm = WorkerFarm()

  const parcelBundle =
    (Parcel(parcelOptions)
      |> publish())
      .refCount()

  const build =
    parcelBundle
    |> filter(({ name }) => name === 'buildStart')

  const buildStart =
    build
    |> mapTo({ type: PARCEL_REPORTER_EVENT.BUILD_START })

  const bundle =
    build
    |> switchMap(({ entryFiles, buildStartTime }) =>
      parcelBundle
      |> filter(({ name }) => name === 'bundled')
      |> map(bundle => ({ ...bundle, entryFiles, buildStartTime })))

  const buildSuccess =
    parcelBundle
    |> mapTo({ type: PARCEL_REPORTER_EVENT.BUILD_SUCCESS })

  const tests = manageRuntimes({
    target, bundle, runtimeProvider, options
  })

  return merge(
    buildStart,
    buildSuccess
  )

}
