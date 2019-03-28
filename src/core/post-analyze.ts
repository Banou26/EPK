import stackTraceParser from 'stacktrace-parser'
import SourceMap from 'source-map'
import { mergeMap } from 'rxjs/operators'
import { File, FileType, Test, TestError } from '../types'
import Path from 'path'
import fs from 'fs'
import { promisify } from 'util'
import { prettifyPath } from '../utils/index'

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


export default bundle => {
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

    const sourceMapPath = `${path.slice(0, -3)}.map`
    const sourceMap = JSON.parse(files.get(sourceMapPath))

    const sourceMapConsumer = sourceMapConsumers.get(file.url) || new SourceMap.SourceMapConsumer(sourceMap)
    if(!sourceMapConsumers.has(file.url)) sourceMapConsumers.set(file.url, sourceMapConsumer)

    const { test: { errors } } = file
    const errorsWithMetadata =
      await Promise.all(
        errors.map(async error => {
          const metaStack =
            await Promise.all(
              stackTraceParser
                .parse(
                  error.name === 'AssertionError'
                    ? error.stack.replace(error.string, '')
                    : error.stack)
                .map(async ({ lineNumber: line, column, file, methodName: name }) => {
                  const { line: originalLine, column: originalColumn, name: originalName, source } = await sourceMapConsumer.originalPositionFor({ line, column: column === null ? 0 : column })
                  return {
                    file,
                    name,
                    line,
                    column,
                    originalLine,
                    originalColumn,
                    originalName,
                    source: prettifyPath(Path.resolve(Path.dirname(path), source.replace('tests\\unit/..', '')))
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

    return {
      ...file,
      type: FileType.POST_ANALYZE,
      test: {
        ...file.test,
        errors: errorsWithMetadata
      }
    }
  })
}
