import type { BuildOptions, Message, OutputFile } from 'esbuild'
import type { Observer } from 'rxjs'

import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'
import { readFile, writeFile } from 'fs/promises'
import { cwd } from 'process'

import esbuild from 'esbuild'
import glob from 'glob'

import asyncObservable from '../utils/async-observable'
import { TestConfig } from '.'

const __dirname = dirname(fileURLToPath(import.meta.url))

export type BuildStatus = 'start' | 'success' | 'failure'

export type BuildOutputFile = {
  file: OutputFile
  sourcemap: OutputFile
}

export type BuildOutput = {
  type: BuildStatus
  errors?: Message[]
  output?: BuildOutputFile[]
}

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

export default ({ testConfig, esbuildOptions }: { testConfig: TestConfig, esbuildOptions: BuildOptions }) =>
  asyncObservable<BuildOutput>(async (observer: Observer<BuildOutput>) => {
    observer.next({ type: 'start' })

    const testFilePaths =
      (await new Promise<string[]>((resolve, reject) =>
        glob(
          testConfig.browserTestGlob,
          {},
          (err, res) => err ? reject(err) : resolve(res)
        )
      )).map(relativePath => resolve(cwd(), relativePath))

    const { errors, outputFiles, stop } = await esbuild.build({
      ...esbuildOptions,
      bundle: true,
      write: false,
      entryPoints: testFilePaths,
      sourcemap: true,
      outdir: './tmp/builds',
      publicPath: '/',
      minify: process.argv.includes('-m') || process.argv.includes('--minify'),
      watch: {
        onRebuild(errors, { outputFiles }) {
          if (errors) observer.error({ type: 'failure', errors })
          else observer.next({ type: 'success', output: outputFilesToBuildOutput(outputFiles) })
        }
      },
      plugins: [
        ...esbuildOptions.plugins ?? [],
        {
          name: 'playwright-browser',
          setup(build) {
            build.onLoad({ filter: /\.(tsx|jsx)$/ }, async (args) => {
              const text = await readFile(args.path, 'utf8')
              return {
                contents: testFilePaths.includes(args.path) ? `${text};\nglobalThis.registerTests();` : text,
                loader: 'tsx'
              }
            })
            build.onLoad({ filter: /\.(js|ts)$/ }, async (args) => {
              const text = await readFile(args.path, 'utf8')
              return {
                contents: testFilePaths.includes(args.path) ? `${text};\nglobalThis.registerTests();` : text,
                loader: 'ts'
              }
            })
          },
        }
      ],
      inject: [join(__dirname, '../src/runtime/index.ts')],
    })

    for (const file of outputFiles) {
      await writeFile(file.path, file.contents)
    }

    if (errors.length) observer.error({ type: 'failure', errors })
    else observer.next({ type: 'success', output: outputFilesToBuildOutput(outputFiles) })

    return () => stop()
  })
