import fs from 'fs'
import Path from 'path'
import { promisify } from 'util'

import SourceMap from 'source-map'
import { parse } from 'stacktrace-parser'

import { prettifyPath } from '../utils/index.ts'
import { TestError, TestResult } from '../types.ts'

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