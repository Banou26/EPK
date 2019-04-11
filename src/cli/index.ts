import logger from './logger.ts'
import epk from '../core/index.ts'
import CliReporter from './reporter.ts'
import { action, options, args } from './parser.ts'

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

// @ts-ignore
cliReporter.subscribe(() => {}, err => logger.error(err))
