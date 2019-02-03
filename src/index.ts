import fg from 'fast-glob'
import Path from 'path'
import cli from './cli/index'
import api from './api/index'
import { BROWSER } from './types'
import logger from './cli/logger'

export * from './api/index'
export * from './test/index'

if (!module.parent) { // Run via CLI
  cli()
    .then(async globs =>
      api({
        browsers: [ BROWSER.CHROME ],
        entryFiles:
          (await fg.async<string>(globs))
            .map(path => Path.join(process.cwd(), path))
      // @ts-ignore
      }).subscribe(_ => {}, err => {logger.error(err)}))
}
