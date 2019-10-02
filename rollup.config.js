import babel from 'rollup-plugin-babel'

export default [
  {
    input: './src/cli/index.js',
    output: {
      file: 'dist/cli.js',
      format: 'cjs'
    },
    plugins: [
      babel({
        exclude: 'node_modules/**',
        extensions: ['.js', '.jsx', '.ts', '.tsx']
      })
    ]
  },
  {
    input: './src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'esm'
    },
    plugins: [
      babel({
        exclude: 'node_modules/**',
        extensions: ['.js', '.jsx', '.ts', '.tsx']
      })
    ]
  },
  {
    input: './src/worker/index.ts',
    output: {
      file: 'dist/worker.js',
      format: 'cjs'
    },
    plugins: [
      babel({
        exclude: 'node_modules/**',
        extensions: ['.js', '.jsx', '.ts', '.tsx']
      })
    ]
  }
]
