import type { TestConfig } from '../core'

import { cwd } from 'process'
import { join } from 'path'
import { rm } from 'fs/promises'

import EPK from '../core'
import configs from '../../test.config'
import cliReporter from '../reporters/cli'

const run = async ({ entryFiles }: { entryFiles?: string[] } = { entryFiles: [] }) => {
  await rm(join(cwd(), './tmp'), { recursive: true }).catch(() => {})

  // console.log(join(cwd(), './test.config.ts'))
  // const epk = EPK({ configs: await import(join(cwd(), './test.config.ts')) })
  const epk =
    EPK({ configs: configs as TestConfig[] })
      .pipe(
        cliReporter()
      )

  epk.subscribe(
    // v => console.log('CLI', v),
    // err => console.error(`CLI error ${err}}`)
  )
}

run()
