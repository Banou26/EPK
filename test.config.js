
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
