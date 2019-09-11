
export default (parcelOptions) => {

  const parcelBundle =
    (Parcel(parcelOptions)
      |> publish())
      .refCount()

  const build =
    parcelBundle
    |> filter(({ name }) => name === 'buildStart')

  const buildStart =
    build
    |> mapTo({ type: REPORTER_EVENT.BUILD_START })

  const bundle =
    build
    |> switchMap(({ entryFiles, buildStartTime }) =>
      parcelBundle
      |> filter(({ name }) => name === 'bundled')
      |> map(bundle => ({ ...bundle, entryFiles, buildStartTime })))

  const buildSuccess =
    parcelBundle
    |> mapTo({ type: REPORTER_EVENT.BUILD_SUCCESS })

  const tests = manageRuntimes({
    target, bundle, runtimeProvider, options
  })

  return merge(
    buildStart,
    buildSuccess
  )

}
