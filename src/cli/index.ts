import epk from '../core/index'
import { action, options, args } from './parser'
import CliReporter from './reporter'
import logger from './logger'

// @ts-ignore
const cliReporter =
  epk({
    watch: action === 'serve',
    target: options.target,
    entryFiles: args,
    browsers: options.browsers
  })
  // @ts-ignore
  |> CliReporter({})

cliReporter.subscribe(() => {}, err => logger.error(err))
