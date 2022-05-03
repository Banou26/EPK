import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { readFile } from 'fs/promises'

const __dirname = globalThis.__dirname ?? dirname(fileURLToPath(import.meta.url))

const config = {
  configs: [
    // {
    //   name: 'extension e2e',
    //   platform: 'chromium',
    //   extensions: [],
    //   web: {
    //     match: ['./tests/e2e/**/*.ts']
    //   },
    //   logLevel: '', // none, error, warn, info
    //   esbuild: {
    //     bundle: true,
    //     format: 'esm',
    //     platform: 'browser',
    //     loader: {
    //       '.js': 'jsx',
    //       '.ts': 'tsx',
    //     },
    //     resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs'],
    //     minify: process.env.NODE_ENV !== 'development',
    //     sourcesContent: true,
    //     logLevel: 'error',
    //     sourcemap: 'external',
    //     write: false
    //   }
    // },
    {
      name: 'extension',
      platform: 'chromium',
      extensionManifest: {
        // manifest here
      },
      maxContexts: 10,
      web: {
        match: ['./tests/unit/web/**/*.ts']
      },
      // contentScript: {
      //   match: ['./tests/unit/content-script/**/*.ts']
      // },
      // backgroundScript: {
      //   match: ['./tests/unit/background-script/**/*.ts']
      // },
      logLevel: '', // none, error, warn, info
      esbuild: {
        bundle: true,
        format: 'esm',
        platform: 'browser',
        loader: {
          '.js': 'jsx',
          '.ts': 'tsx',
        },
        resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs'],
        minify: process.env.NODE_ENV !== 'development',
        sourcesContent: true,
        logLevel: 'error',
        sourcemap: 'external',
        write: false
      }
    }
  ]
}

export default config
