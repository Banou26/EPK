import { relative } from 'path'

import esbuild from 'esbuild'

async function esbuildResolve(id, dir) {
  let result;

  await esbuild.build({
    stdin: {
      contents: `import ${JSON.stringify(id)}`,
      resolveDir: dir
    },
    write: false,
    bundle: true,
    treeShaking: false,
    ignoreAnnotations: true,
    platform: 'node',
    plugins: [
      {
        name: 'resolve',
        setup({ onLoad }) {
          onLoad({ filter: /.*/ }, (args) => {
            result = args.path;
            return { contents: '' };
          });
        }
      }
    ]
  });
  return result;
}

esbuild.build({
  watch: process.argv.includes('-w') || process.argv.includes('--watch'),
  bundle: true,
  format: 'esm',
  platform: 'node',
  // external: ['./node_modules/*'],
  plugins: [
    {
      name: 'make-all-packages-external',
      setup(build) {
        let filter = /^[^.\/]|^\.[^.\/]|^\.\.[^\/]/ // Must not start with "/" or "./" or "../"
        build.onResolve({ filter }, async args => {
          if (args.path === 'playwright') return ({ path: 'playwright', external: true })
          const resolvedPath = await esbuildResolve(args.path, '.')
          const result = resolvedPath ? relative('./node_modules', resolvedPath).replaceAll('\\', '/') : args.path
          return ({ path: result, external: true })
        })
      },
    }
  ],
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
