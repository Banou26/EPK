import type { TestConfig } from '../core'

import { cwd } from 'process'
import { join } from 'path'
import path from 'path'
import { createServer } from 'http'
import { pathToFileURL } from 'url'

import { createReadStream } from 'fs'
import { rm } from 'fs/promises'

import mime from 'mime'

import EPK from '../core'
import cliReporter from '../reporters/cli'
import { shareReplay } from 'rxjs/operators'
import { EPKConfig } from '../types'

const run = async ({ entryFiles }: { entryFiles?: string[] } = { entryFiles: [] }) => {
  const watch = process.argv.includes('-w') || process.argv.includes('--watch')
  const configPath = pathToFileURL(undefined ?? join(cwd(), './test.config.js')).toString()
  const { default: config }: { default: EPKConfig } = await import(configPath)
  await rm(join(cwd(), './tmp'), { recursive: true }).catch(() => {})

  // console.log(join(cwd(), './test.config.ts'))
  // const epk = EPK({ configs: await import(join(cwd(), './test.config.ts')) })
  // const server =
  //   createServer(async (req, res) => {
  //     const url = new URL(req.url, 'http://localhost:2345')
  //     res.setHeader('Access-Control-Allow-Origin', 'http://localhost:1234')
  //     try {
  //       res.setHeader('Content-Type', mime.getType(path.resolve('../tmp/', path.join('builds', url.pathname))))
  //       await new Promise((resolve, reject) =>
  //         createReadStream(path.resolve('../tmp/', path.join('builds', url.pathname)))
  //         .on('error', reject)
  //         .on('finish', resolve)
  //         .pipe(res)
  //       )
  //     } catch (err) {
  //       res.setHeader('Content-Type', mime.getType(path.resolve('./', 'builds/index.html')))
  //       createReadStream(path.resolve('../tmp/', 'builds/index.html'))
  //       .pipe(res)
  //     }
  //   })
  //   .listen(2345)
  
  const epk =
    EPK({ config, watch })
      .pipe(
        shareReplay(),
        cliReporter()
      )

  epk.subscribe(
    // v => console.log('CLI', v),
    // err => console.error(`CLI error ${err}}`)
  )
}

run()
