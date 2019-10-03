// import Parcel from '@parcel/core'

// console.log(new Parcel())

import EPK from '../core/index.ts'

const run = (entryFiles) => {
  const epk = EPK({
    entryFiles
  })

  epk.subscribe(v => console.log(v))
}

run()
