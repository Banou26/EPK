import type { StackFrame } from 'stacktrace-js'

import { SourceMapConsumer } from 'source-map-js'
import { relative } from 'path'
import { cwd } from 'process'

export const parseErrorStack = ({ group, sourceMapString, originalStack, errorStack }: { group?: boolean, sourceMapString: string, originalStack: string, errorStack: StackFrame[] }) => {
  const sourceMap = JSON.parse(sourceMapString)
  const sourceMapConsumer = new SourceMapConsumer(sourceMap)
  const result = errorStack.map(stackFrame => ({ ...stackFrame, ...sourceMapConsumer.originalPositionFor({ line: stackFrame.lineNumber, column: stackFrame.columnNumber }) }))
  const resultString = result.map(mappedStackFrame => {
    const lineStr = mappedStackFrame.line ?? mappedStackFrame.lineNumber ?? 0
    const columnStr = mappedStackFrame.column ?? mappedStackFrame.columnNumber ?? 0
    const { functionName } = mappedStackFrame
    const source = relative(cwd(), mappedStackFrame.source ?? '').slice(6) || '<anonymous>'
    return `at ${functionName ?? ''}${functionName ? ' (' : ''}${source}:${lineStr}:${columnStr}${functionName ? ')' : ''}`
  })
  return {
    message: originalStack.slice(0, originalStack.indexOf('\n')).replace('Error: ', ''),
    stack: `${originalStack.slice(0, originalStack.indexOf('\n'))}\n${resultString.slice(0, group ? -9 : -9).join('\n')}`.trim()
  }
}
