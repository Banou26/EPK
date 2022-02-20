import type { TestConfig } from '../core'

import { join } from 'path'
import { cwd } from 'process'
import EPK from '../core'
import configs from '../../test.config'

const run = async ({ entryFiles }: { entryFiles?: string[] } = { entryFiles: [] }) => {
  // console.log(join(cwd(), './test.config.ts'))
  // const epk = EPK({ configs: await import(join(cwd(), './test.config.ts')) })
  const epk = EPK({ configs: configs as TestConfig[] })

  epk.subscribe(
    v => console.log('CLI', v),
    err => console.error(err)
  )
}

run()
