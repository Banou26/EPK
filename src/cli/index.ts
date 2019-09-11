import 'v8-compile-cache'
import program from 'commander'

import pkg from '../../package.json'

process.on('unhandledRejection', error => {
  console.error(error)
  process.exit(1)
})

program.version(pkg.version)
