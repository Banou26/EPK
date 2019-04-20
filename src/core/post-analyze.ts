import fs from 'fs'
import Path from 'path'
import { promisify } from 'util'

import SourceMap from 'source-map'
import { mergeMap } from 'rxjs/operators'
import { parse } from 'stacktrace-parser'

import { prettifyPath } from '../utils/index.ts'
import { File, FileType, TestError, LogType } from '../types.ts'

const readFile = promisify(fs.readFile)

const makeStackLocation = ({ originalColumn, originalLine, source }) => `\
${source}:${originalLine}:${originalColumn}`

const makeStackLines = metaLine => `\
at ${metaLine.originalName ? `${metaLine.originalName} (${makeStackLocation(metaLine)})` : makeStackLocation(metaLine)}`

const makeStack = (error: TestError) => `\
${error.name}: ${error.message}

${error
    .metaStack
    .map(makeStackLines)
    .join('\n')}
`

export default (options, bundle) => {
  const files = new Map()
  const sourceMapConsumers = new Map()

  return mergeMap(async (file: File) => {
    const { name: path } = bundle

    if (!files.has(path)) {
      const content = await readFile(path, { encoding: 'utf8' })
      files.set(path, content)
    }

    for (const childBundle of bundle.childBundles) {
      const { name: path } = childBundle
      if (!files.has(path)) {
        const content = await readFile(path, { encoding: 'utf8' })
        files.set(path, content)
      }
    }

    const sourceMapPath = files.has(`${path.slice(0, -3)}.map`) ? `${path.slice(0, -3)}.map` : `${path}.map` // weird parcel bug
    const sourceMap = JSON.parse(files.get(sourceMapPath))

    const sourceMapConsumer = sourceMapConsumers.get(file.url) || new SourceMap.SourceMapConsumer(sourceMap)
    if (!sourceMapConsumers.has(file.url)) sourceMapConsumers.set(file.url, sourceMapConsumer)

    const { test: { logs } } = file

    const errors =
      logs
        .filter(({ type }) => type === LogType.uncaughtError)
        .map(({ error }) => error)

    const errorsWithMetadata =
      await Promise.all(
        errors.map(async error => {
          const metaStack =
            await Promise.all(
              parse(
                error.name === 'AssertionError'
                  ? error.stack.replace(error.string, '')
                  : error.stack || error.string)
                .map(async ({ lineNumber: line, column, file, methodName: name }) => {
                  const { line: originalLine, column: originalColumn, name: originalName, source } = await sourceMapConsumer.originalPositionFor({ source: file, line, column: column === null ? 0 : column })
                  return {
                    file,
                    name,
                    line,
                    column,
                    originalLine,
                    originalColumn,
                    originalName,
                    source:
                      source &&
                      prettifyPath(
                        Path.resolve(source.includes(sourceMapConsumer.sourceRoot)
                          ? Path.resolve(process.cwd(), options.outDir)
                          : process.cwd(), source))
                  }
                })
            )
          const testError = {
            ...error,
            metaStack
          }
          testError.originalStack = makeStack(testError)
          return testError
        })
      )

    const logsWithMetadataErrors =
      logs.map(log =>
        log.type === LogType.uncaughtError
          ? {
            type: log.type,
            error: errorsWithMetadata[errors.indexOf(log.error)]
          }
          : log)

    return {
      ...file,
      type: FileType.POST_ANALYZE,
      test: {
        ...file.test,
        logs: logsWithMetadataErrors
      }
    }
  })
}
