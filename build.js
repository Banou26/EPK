import esbuild from 'esbuild'

esbuild.build({
  watch: process.argv.includes('-w') || process.argv.includes('--watch'),
  bundle: true,
  format: 'esm',
  platform: 'node',
  plugins: [{
    name: 'make-all-packages-external',
    setup(build) {
      let filter = /^[^.\/]|^\.[^.\/]|^\.\.[^\/]/ // Must not start with "/" or "./" or "../"
      build.onResolve({ filter }, args => ({ path: args.path, external: true }))
    },
  }],
  entryPoints: ['./src/cli/index.ts'],
  outfile: './build/cli.js',
  publicPath: '/',
  inject: ['./src/react-shim.ts'],
  jsx: 'transform',
  minify: process.argv.includes('-m') || process.argv.includes('--minify')
})

esbuild.build({
  watch: process.argv.includes('-w') || process.argv.includes('--watch'),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  entryPoints: ['./src/lib'],
  outfile: './lib/lib.js',
  publicPath: '/',
  jsx: 'transform',
  minify: process.argv.includes('-m') || process.argv.includes('--minify')
})


// esbuild.build({
//   watch: process.argv.includes('-w') || process.argv.includes('--watch'),
//   bundle: true,
//   format: 'esm',
//   platform: 'node',
//   external: ['./node_modules/*'],
//   entryPoints: ['./src/cli/index.ts'],
//   outfile: './build/cli-esm.js',
//   publicPath: '/',
//   inject: ['./src/react-shim.ts'],
//   jsx: 'transform',
//   minify: process.argv.includes('-m') || process.argv.includes('--minify')
// })

// esbuild.build({
//   watch: process.argv.includes('-w') || process.argv.includes('--watch'),
//   bundle: true,
//   format: 'cjs',
//   platform: 'node',
//   external: ['./node_modules/*'],
//   entryPoints: ['./src/cli/index.ts'],
//   outfile: './build/cli.js',
//   publicPath: '/',
//   inject: ['./src/react-shim.ts'],
//   jsx: 'transform',
//   minify: process.argv.includes('-m') || process.argv.includes('--minify')
// })

esbuild.build({
  watch: process.argv.includes('-w') || process.argv.includes('--watch'),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  entryPoints: ['./src/runtime/content-script-proxy.ts'],
  outfile: './build/content-script-proxy.js',
  publicPath: '/',
  jsx: 'transform',
  minify: process.argv.includes('-m') || process.argv.includes('--minify')
})
