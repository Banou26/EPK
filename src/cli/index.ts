// import Parcel from '@parcel/core'

// console.log(new Parcel())

import EPK from '../core'

const run = (entryFiles) => {
  const epk = EPK({
    entryFiles
  })

  epk.subscribe(
    v => console.log(v),
    err => console.error(err)
  )
}

run()
