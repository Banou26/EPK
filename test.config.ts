
export default [
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
    name: 'background',
    platform: 'chromium',
    environment: 'background-script',
    browserTestGlob: './tests/unit/background/index.ts',
    // browserTestGlob: './tests/unit/**/*.ts',
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
