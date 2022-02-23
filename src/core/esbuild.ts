import type { BuildOptions, Message, OutputFile } from 'esbuild'
import type { Observer } from 'rxjs'

import { dirname, join, parse, relative, resolve } from 'path'
import { fileURLToPath } from 'url'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { cwd } from 'process'

import esbuild from 'esbuild'
import glob from 'glob'

import asyncObservable from '../utils/async-observable'
import { toGlobal } from '../utils/runtime'
import { TestConfig, BuildOutput, BuildOutputFile } from '../types'

const __dirname = dirname(fileURLToPath(import.meta.url))

const outputFilesToBuildOutput =
  (
    outputFiles: OutputFile[],
    { testConfig, web, contentScript, backgroundScript }: { testConfig: TestConfig, web: string[], contentScript: string[], backgroundScript: string[] }
  ): BuildOutputFile[] =>
    outputFiles
      .filter(({ path }) => !path.endsWith('.map'))
      .map((file) => ({
        originalPath:
          web.find(path => path.includes(relative(join(cwd(), `./tmp/builds/${testConfig.name}`), file.path).slice(0, -parse(file.path).ext.length))) ??
          contentScript.find(path => path.includes(relative(join(cwd(), `./tmp/builds/${testConfig.name}`), file.path).slice(0, -parse(file.path).ext.length))) ??
          backgroundScript.find(path => path.includes(relative(join(cwd(), `./tmp/builds/${testConfig.name}`), file.path).slice(0, -parse(file.path).ext.length))),
        environment:
          web.find(path => path.includes(relative(join(cwd(), `./tmp/builds/${testConfig.name}`), file.path).slice(0, -parse(file.path).ext.length))) ? 'web' :
          contentScript.find(path => path.includes(relative(join(cwd(), `./tmp/builds/${testConfig.name}`), file.path).slice(0, -parse(file.path).ext.length))) ? 'content-script' :
          backgroundScript.find(path => path.includes(relative(join(cwd(), `./tmp/builds/${testConfig.name}`), file.path).slice(0, -parse(file.path).ext.length))) ? 'background-script' :
          undefined,
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
        ? `${text};\nglobalThis.${toGlobal('initDone')}({ path: \`${JSON.stringify(args.path)}\` });`
        : text,
    loader
  }
}

const matchGlobFiles = (_glob: string) =>
  new Promise<string[]>(
    (resolve, reject) =>
      glob(_glob, {}, (err, res) => err ? reject(err) : resolve(res))
  )
    .then(filePaths =>
      filePaths.map(relativePath => resolve(cwd(), relativePath))
    )

export default ({ testConfig, esbuildOptions }: { testConfig: TestConfig, esbuildOptions: BuildOptions }) =>
  asyncObservable<BuildOutput>(async (observer: Observer<BuildOutput>) => {
    observer.next({ type: 'build', name: 'start' })

    const _webFilePaths = Promise.all(testConfig.web.match?.map(matchGlobFiles)).then(arr => arr.flat())
    const _contentScriptfilePaths = Promise.all(testConfig.contentScript.match?.map(matchGlobFiles)).then(arr => arr.flat())
    const _backgroundScriptfilePaths = Promise.all(testConfig.backgroundScript.match?.map(matchGlobFiles)).then(arr => arr.flat())

    const [webFilePaths, contentScriptfilePaths, backgroundScriptfilePaths] = await Promise.all([_webFilePaths, _contentScriptfilePaths, _backgroundScriptfilePaths])

    const testFilePaths = [webFilePaths, contentScriptfilePaths, backgroundScriptfilePaths].flat()

    const makeError = (errorMessages: Message[]) =>
      observer.error({
        type: 'build',
        name: 'failure',
        errors: errorMessages,
        web: { filePaths: webFilePaths },
        contentScript: { filePaths: contentScriptfilePaths },
        backgroundScript: { filePaths: backgroundScriptfilePaths }
      })

    const makeSuccess = async (outputFiles: OutputFile[]) => {
      for (const file of outputFiles) {
        try {
          await mkdir(parse(file.path).dir, { recursive: true })
        } catch (err) {}
        await writeFile(file.path, file.contents)
      }
      observer.next({
        type: 'build',
        name: 'success',
        outputs: outputFilesToBuildOutput(outputFiles, { testConfig, web: webFilePaths, contentScript: contentScriptfilePaths, backgroundScript: backgroundScriptfilePaths }),
        web: { filePaths: webFilePaths },
        contentScript: { filePaths: contentScriptfilePaths },
        backgroundScript: { filePaths: backgroundScriptfilePaths }
      })
    }

    const { errors, metafile, outputFiles, stop } = await esbuild.build({
      ...esbuildOptions,
      metafile: true,
      bundle: true,
      write: false,
      entryPoints: testFilePaths,
      sourcemap: true,
      outdir: join(cwd(), `./tmp/builds/${testConfig.name}`),
      publicPath: '/',
      minify: process.argv.includes('-m') || process.argv.includes('--minify'),
      watch: {
        async onRebuild(error, { errors, outputFiles }) {
          if (errors) makeError(errors)
          else await makeSuccess(outputFiles)
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

    if (errors.length) makeError(errors)
    else await makeSuccess(outputFiles)

    return () => stop()
  })
