// import Parcel from '@parcel/core'

// console.log(new Parcel())

import EPK from '../core'

const run = ({ entryFiles }: { entryFiles?: string[] } = { entryFiles: [] }) => {
  const epk = EPK({})

  epk.subscribe(
    v => console.log('CLI', v),
    err => console.error(err)
  )
}

run()
