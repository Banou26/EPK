import { EPKConfig } from 'src/types'

const config: EPKConfig = {
  configs: [
    // {
    //   name: 'browser',
    //   platform: 'chromium',
    //   browserTestGlob: './tests/unit/index.ts',
    //   // browserTestGlob: './tests/unit/**/*.ts',
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
    //     outdir: './tmp/builds/unit',
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
      web: {
        // match: ['./tests/unit/**/*.ts']
        match: ['./tests/unit/web/index.ts']
      },
      contentScript: {
        match: ['./tests/unit/content-script/**/*.ts']
      },
      backgroundScript: {
        match: ['./tests/unit/background-script/**/*.ts']
      },
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
        outdir: './tmp/builds/unit/background',
        logLevel: 'error',
        sourcemap: 'external',
        write: false
      }
    }
  ]
}

export default config
