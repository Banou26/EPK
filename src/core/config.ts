import type { EPKConfig } from 'src/types'

import { watch } from 'fs/promises'
import { cwd } from 'process'
import { join } from 'path'
import { pathToFileURL } from 'url'

import { Observable } from 'rxjs'

export const configFileWatcher = (path: string) =>
  new Observable<EPKConfig>(observer => {
    const fileUrlPath = pathToFileURL(undefined ?? join(cwd(), './test.config.js')).toString()

    import(fileUrlPath)
      .then(({ default: config }: { default: EPKConfig }) =>
        observer.next(config)
      )

    const { signal, abort } = new AbortController()
    const watcher = watch(path, { signal })
    ;(async () => {
      try {
        for await (const event of watcher) {
          const { default: config }: { default: EPKConfig } = await import(`${fileUrlPath}?t=${Date.now()}`)
          if (event.eventType === 'change') observer.next(config)
        }
      } catch (err) {
        if (err.name === 'AbortError') return
        throw err
      }
    })()
    return () => abort()
  })
