import babel from 'rollup-plugin-babel'
import json from 'rollup-plugin-json'

export default {
  input: 'src/cli/index.ts',
  output: {
    file: 'lib/cli.js',
    format: 'cjs'
  },
  plugins: [
    babel({
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      exclude: 'node_modules/**', // only transpile our source code
      babelrc: true
    }),
    json()
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
    'react'
  ]
}