import esbuild from 'esbuild'

esbuild.build({
  watch: process.argv.includes('-w') || process.argv.includes('--watch'),
  bundle: true,
  format: 'esm',
  // target: 'esnext',
  platform: 'node',
  external: ['./node_modules/*'],
  entryPoints: ['./src/cli/index.ts'],
  outfile: './build/cli.js',
  // outdir: './build',
  publicPath: '/',
  inject: ['./src/react-shim.ts'],
  jsx: 'transform',
  minify: process.argv.includes('-m') || process.argv.includes('--minify')
})
