import type { EPKConfig } from 'src/types'

import { mkdir, readFile, unlink, writeFile } from 'fs/promises'
import { cwd } from 'process'
import { join, parse, relative } from 'path'
import { pathToFileURL } from 'url'

import esbuild, { Message, OutputFile } from 'esbuild'
import asyncObservable from '../utils/async-observable'

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

export const configFileWatcher = ({ path, watch }: { path: string, watch?: boolean }) =>
  asyncObservable<EPKConfig>(async observer => {
    const isInModulePackage = (JSON.parse((await readFile(join(cwd(), './package.json'))).toString()).type ?? '') === 'module'
    const relativePath = relative(cwd(), path)
    const absolutePath = join(cwd(), relativePath)
    const esmFilePath = pathToFileURL(absolutePath).toString()
    let outputCount = 0
    const makeSuccess = async (outputFiles: OutputFile[]) => {
      const outputPath = `${absolutePath}__epk-config__${outputCount}__.js`
      const esmOutputPath = pathToFileURL(outputPath).toString()
      outputCount++
      for (const file of outputFiles) {
        try {
          await mkdir(parse(isInModulePackage ? esmFilePath : absolutePath).dir, { recursive: true })
        } catch (err) {}
          await writeFile(outputPath, file.contents)
      }
      const { default: config }: { default: EPKConfig } = await import(esmOutputPath)
      observer.next(
        isInModulePackage
          ? config
          // @ts-ignore
          : config.default
      )
      await unlink(outputPath)
      if (!watch) observer.complete()
    }

    const makeError = (errorMessages: Message[]) => {
      // todo: make real error messages
      console.error(errorMessages)
    }

    const { errors, outputFiles, stop } = await esbuild.build({
      bundle: true,
      write: false,
      entryPoints: [path],
      format: isInModulePackage ? 'esm' : 'cjs',
      watch:
        watch
          ? {
            async onRebuild(error, result) {
              if (!result) return
              const { errors, outputFiles } = result
              if (errors.length) makeError(errors)
              else await makeSuccess(outputFiles)
            }
          }
          : undefined,
      plugins: [
        {
          name: 'make-all-packages-external',
          setup(build) {
            let filter = /^[^.\/]|^\.[^.\/]|^\.\.[^\/]/ // Must not start with "/" or "./" or "../"
            build.onResolve({ filter }, async args => {
              if (args.path === path) return ({ path: args.path })
              if (args.path === 'p-limit') return ({ path: 'p-limit', external: true })
              if (args.path === 'playwright') return ({ path: 'playwright', external: true })
              const resolvedPath = await esbuildResolve(args.path, '.')
              const result = resolvedPath ? relative('./node_modules', resolvedPath).replaceAll('\\', '/') : args.path
              return ({ path: result, external: true })
            })
          },
        }
      ],
    })

    if (errors.length) makeError(errors)
    else await makeSuccess(outputFiles)

    return () => stop && stop()
  })
