import type { BuildOptions, Message, OutputFile } from 'esbuild'
import type { Observer } from 'rxjs'

import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { writeFile } from 'fs/promises'

import esbuild from 'esbuild'

import AsyncObservable from '../utils/async-observable'

const cwd = process.cwd()

// const __dirname = dirname(fileURLToPath(import.meta.url))

export enum BUILD_EVENT {
  START = 'start',
  PROGRESS = 'progress',
  SUCCESS = 'success',
  FAILURE = 'failure',
  LOG = 'log'
}

export type BuildOutputFile = {
  file: OutputFile
  sourcemap: OutputFile
}

export type BuildOutput = {
  type: BUILD_EVENT
  errors?: Message
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

export default (esbuildOptions: BuildOptions) =>
  AsyncObservable<BuildOutput>(async (observer: Observer<BuildOutput>) => {
    observer.next({ type: BUILD_EVENT.START })
    const { errors, outputFiles, stop } = await esbuild.build({
      ...esbuildOptions,
      bundle: true,
      write: false,
      entryPoints: [join(cwd, './tests/unit/index.ts')],
      // entryPoints: [join(cwd, './tests/unit/index.ts'), join(cwd, './tests/unit/example.ts')],
      sourcemap: true,
      // outfile: './build/index.js',
      outdir: './tmp/builds',
      publicPath: '/',
      minify: process.argv.includes('-m') || process.argv.includes('--minify'),
      watch: {
        onRebuild(errors, { outputFiles }) {
          if (errors) observer.error({ type: BUILD_EVENT.FAILURE, errors })
          else observer.next({ type: BUILD_EVENT.SUCCESS, output: outputFilesToBuildOutput(outputFiles) })
        }
      }
    })

    for (const file of outputFiles) {
      await writeFile(file.path, file.contents)
    }

    if (errors.length) observer.error({ type: BUILD_EVENT.FAILURE, errors })
    else observer.next({ type: BUILD_EVENT.SUCCESS, output: outputFilesToBuildOutput(outputFiles) })

    return () => stop()
  })
