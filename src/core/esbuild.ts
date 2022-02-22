import type { BuildOptions, Message, OutputFile } from 'esbuild'
import type { Observer } from 'rxjs'

import { dirname, join, parse, resolve } from 'path'
import { fileURLToPath } from 'url'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { cwd } from 'process'

import esbuild from 'esbuild'
import glob from 'glob'

import asyncObservable from '../utils/async-observable'
import { toGlobal } from '../utils/runtime'
import { TestConfig, BuildOutput, BuildOutputFile } from '../types'

const __dirname = dirname(fileURLToPath(import.meta.url))

const outputFilesToBuildOutput = (outputFiles: OutputFile[]): BuildOutputFile[] =>
  outputFiles
    .filter(({ path }) => !path.endsWith('.map'))
    .map((file) => ({
      file,
      sourcemap: outputFiles.find(({ path: _path }) =>
        _path.includes(file.path) &&
        _path.endsWith('.map')
      )
    }))

const pluginOnload = (testFilePaths: string[], loader: esbuild.Loader) => async (args) => {
  const text = await readFile(args.path, 'utf8')
  return {
    contents:
      testFilePaths.includes(args.path)
        ? `${text};\nglobalThis.${toGlobal('initDone')}();`
        : text,
    loader
  }
}

export default ({ testConfig, esbuildOptions }: { testConfig: TestConfig, esbuildOptions: BuildOptions }) =>
  asyncObservable<BuildOutput>(async (observer: Observer<BuildOutput>) => {
    observer.next({ type: 'build', name: 'start' })

    const testFilePaths =
      (await new Promise<string[]>((resolve, reject) =>
        glob(
          testConfig.browserTestGlob,
          {},
          (err, res) => err ? reject(err) : resolve(res)
        )
      )).map(relativePath => resolve(cwd(), relativePath))

    const { errors, metafile, outputFiles, stop } = await esbuild.build({
      ...esbuildOptions,
      metafile: true,
      bundle: true,
      write: false,
      entryPoints: testFilePaths,
      sourcemap: true,
      outdir: './tmp/builds',
      publicPath: '/',
      minify: process.argv.includes('-m') || process.argv.includes('--minify'),
      watch: {
        async onRebuild(errors, { outputFiles }) {
          for (const file of outputFiles) {
            try {
              await mkdir(parse(file.path).dir, { recursive: true })
            } catch (err) {}
            await writeFile(file.path, file.contents)
          }
          if (errors) observer.error({ type: 'build', name: 'failure', errors })
          else observer.next({ type: 'build', name: 'success', outputs: outputFilesToBuildOutput(outputFiles) })
        }
      },
      plugins: [
        ...esbuildOptions.plugins ?? [],
        {
          name: 'playwright-browser',
          setup(build) {
            build.onLoad({ filter: /\.(tsx|jsx)$/ }, pluginOnload(testFilePaths, 'tsx'))
            build.onLoad({ filter: /\.(js|ts)$/ }, pluginOnload(testFilePaths, 'ts'))
          },
        }
      ],
      inject: [join(__dirname, '../src/runtime/index.ts'), join(__dirname, '../src/runtime/console.ts')],
    })

    for (const file of outputFiles) {
      try {
        await mkdir(parse(file.path).dir, { recursive: true })
      } catch (err) {}
      await writeFile(file.path, file.contents)
    }
    if (errors.length) observer.error({ type: 'build', name: 'failure', errors })
    else observer.next({ type: 'build', name: 'success', outputs: outputFilesToBuildOutput(outputFiles) })

    return () => stop()
  })
