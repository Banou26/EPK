import epk from '../core/index'
import { options, args } from './parser'
import cliReporter from './reporter'
import logger from './logger'

// @ts-ignore
cliReporter({})(epk({
  watch: options.action === 'serve',
  target: options.target,
  entryFiles: args,
  browsers: options.browsers
})).subscribe(() => {}, err => logger.error(err))
