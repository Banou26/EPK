import babel from 'rollup-plugin-babel'

export default {
  input: 'src/runtime/index.ts',
  output: {
    file: 'lib/browser.js',
    format: 'cjs'
  },
  plugins: [
    babel({
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      exclude: 'node_modules/**', // only transpile our source code
      babelrc: true
    })
  ],
  external: [
    'fs',
    'util',
    'core-js',
    'child_process',
    'module',
    'path',
    'core-js/features/set',
    'rxjs',
    'rxjs/operators',
    'parcel-bundler',
    'flatted',
    'v8-compile-cache',
    'get-port',
    'commander',
    'chalk',
    'ink',
    'react',
    'power-assert',
    'events'
  ]
}