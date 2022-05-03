import type { BuildOptions, Message, OnLoadArgs, OutputFile } from 'esbuild'
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

// @ts-ignore
const __dirname: string = globalThis.__dirname ?? dirname(fileURLToPath(import.meta.url))

const includesSourcePath =
  ({ file, testConfig }: { file: OutputFile, testConfig: TestConfig }) =>
    path => path.includes(relative(join(cwd(), `./tmp/builds/${testConfig.name}`), file.path).slice(0, -parse(file.path).ext.length))

const buildPathToSourcePath =
  (
    { file, testConfig, web, contentScript, backgroundScript }:
    { file: OutputFile, testConfig: TestConfig, web: string[], contentScript: string[], backgroundScript: string[] }
  ) =>
    [...web, ...contentScript, ...backgroundScript]
      .find(includesSourcePath({ file, testConfig }))

const sourcePathToEnvironment =
  (
    { file, web, contentScript, backgroundScript }:
    { file: OutputFile, web: string[], contentScript: string[], backgroundScript: string[] }
  ) =>
    web.includes(file.path) ? 'web' :
    contentScript.includes(file.path) ? 'content-script' :
    backgroundScript.includes(file.path) ? 'background-script' :
    undefined

const buildPathToEnvironment =
  (
    { file, testConfig, web, contentScript, backgroundScript }:
    { file: OutputFile, testConfig: TestConfig, web: string[], contentScript: string[], backgroundScript: string[] }
  ) =>
      web.find(includesSourcePath({ file, testConfig })) ? 'web' :
      contentScript.find(includesSourcePath({ file, testConfig })) ? 'content-script' :
      backgroundScript.find(includesSourcePath({ file, testConfig })) ? 'background-script' :
      undefined

const outputFilesToBuildOutput =
  (
    outputFiles: OutputFile[],
    { testConfig, web, contentScript, backgroundScript }: { testConfig: TestConfig, web: string[], contentScript: string[], backgroundScript: string[] }
  ): BuildOutputFile[] =>
    outputFiles
      .filter(({ path }) => !path.endsWith('.map'))
      .map((file) => ({
        originalPath: buildPathToSourcePath({ file, testConfig, web, contentScript, backgroundScript }),
        environment: buildPathToEnvironment({ file, testConfig, web, contentScript, backgroundScript }),
        file,
        sourcemap: outputFiles.find(({ path: _path }) =>
          _path.includes(file.path) &&
          _path.endsWith('.map')
        )
      }))

const pluginOnload =
  (
    { testFilePaths, loader, web, contentScript, backgroundScript }:
    { testFilePaths: string[], loader: esbuild.Loader, web: string[], contentScript: string[], backgroundScript: string[] }
  ) =>
    async (args: OnLoadArgs) => {
      const text = await readFile(args.path, 'utf8')
      const environment = sourcePathToEnvironment({ file: { path: args.path } as unknown as OutputFile, web, contentScript, backgroundScript  })
      return {
        contents:
          testFilePaths.includes(args.path)
            ? `${text};\nglobalThis.${toGlobal('initDone')}({ path: \`${JSON.stringify(args.path)}\`, environment: \`${environment}\` });`
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

export default ({ testConfig, esbuildOptions, watch }: { testConfig: TestConfig, esbuildOptions: BuildOptions, watch?: boolean }) =>
  asyncObservable<BuildOutput>(async (observer: Observer<BuildOutput>) => {
    observer.next({ type: 'build', name: 'start' })

    const _webFilePaths = Promise.all(testConfig.web?.match?.map(matchGlobFiles) ?? []).then(arr => arr.flat())
    const _contentScriptfilePaths = Promise.all(testConfig.contentScript?.match?.map(matchGlobFiles) ?? []).then(arr => arr.flat())
    const _backgroundScriptfilePaths = Promise.all(testConfig.backgroundScript?.match?.map(matchGlobFiles) ?? []).then(arr => arr.flat())

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
        async onRebuild(error, result) {
          if (!result) return
          const { errors, outputFiles } = result
          if (errors.length) makeError(errors)
          else await makeSuccess(outputFiles)
        }
      },
      plugins: [
        ...esbuildOptions.plugins ?? [],
        {
          name: 'playwright-browser',
          setup(build) {
            build.onLoad({ filter: /\.(tsx|jsx)$/ }, pluginOnload({ testFilePaths: testFilePaths, loader: 'tsx', testConfig, web: webFilePaths, contentScript: contentScriptfilePaths, backgroundScript: backgroundScriptfilePaths }))
            build.onLoad({ filter: /\.(js|ts)$/ }, pluginOnload({ testFilePaths: testFilePaths, loader: 'ts', testConfig, web: webFilePaths, contentScript: contentScriptfilePaths, backgroundScript: backgroundScriptfilePaths }))
          },
        }
      ],
      inject: [join(__dirname, '../src/runtime/index.ts'), join(__dirname, '../src/runtime/console.ts'), ...esbuildOptions.inject ?? []],
    })

    if (errors.length) makeError(errors)
    else await makeSuccess(outputFiles)

    return () => stop()
  })
