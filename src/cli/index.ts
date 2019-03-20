import epk from '../core/index'
import { action, options, args } from './parser'
import cliReporter from './reporter'
import logger from './logger'

// @ts-ignore
cliReporter({})(epk({
  watch: action === 'serve',
  target: options.target,
  entryFiles: args,
  browsers: options.browsers
})).subscribe(() => {}, err => logger.error(err))
