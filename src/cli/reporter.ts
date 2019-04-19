import util from 'util'

import chalk from 'chalk'
import { scan } from 'rxjs/operators'

import logger from './logger.ts'
import { prettifyPath } from '../utils/index.ts'
import { Context, File, Test, FileType, LogType } from '../types.ts'

const showAssertError = message => `\
  ${chalk.gray(
      message
        .split('\n')
        .shift()
        .trim())}

${chalk.red(
    message
      .split('\n')
      .splice(2)
      .map(str => ` ${str}`)
      .join('\n'))}`

const showStackError = stack =>
  chalk.red(
    stack
      .split('\n')
      .map(str => `  ${str.trim()}`)
      .join('\n'))

const LogTypeColor = new Map([
  [LogType.log, chalk.white],
  [LogType.info, chalk.blue],
  [LogType.warn, chalk.yellow],
  [LogType.error, chalk.redBright],
  [LogType.uncaughtError, chalk.red]
])
      
const formatTest = ({ description, logs }: Test) => `\
 ${description}
${logs
  .map(({ type, arguments: args, error, error: { name, message, stack, originalStack } = {} }) => {
    if (error) {
      if (name === 'AssertionError') return showAssertError(message)
      else return showStackError(originalStack || stack || message)
    } else return `  ${
      LogTypeColor.get(type)(
        args
          .map((val, i) =>
            util
              .inspect(
                val,
                {
                  compact: false,
                  breakLength: process.stdout.columns
                })
              .split('\n')
              .map((str, i) => `${i > 0 ? '  ' : ''}${str}`)
              .join('\n'))
          .join(' '))}`
  })
  .join('\n')}`
 
 
const formatTests = ({ name, tests = [] }: File) =>
  tests.length
  ? `
${chalk.underline(prettifyPath(name))}

${tests
    .map(formatTest)
    .join('\n')}`
  : ''
// buildTime, analyzeTime, testTime,
// ${chalk.green(`Built in ${buildTime}.`)}
// ${chalk.green(`Analyzed in ${analyzeTime}.`)}
// ${chalk.green(`Tested in ${testTime}.`)}

const formatAnalyzing = (files: File[]) => {
  const analyzingFiles = files.filter(({ type }) => FileType.ANALYZE === type)
  return analyzingFiles.length
    ? `Analyzing ${
      analyzingFiles
        .map(({ name }) => prettifyPath(name))
        .join(', ')
      }\n\n`
    : ''
}

const formatLogs = (files: File[]) => `\
${chalk.reset(
  files
    .map(({ tests, ...rest }) => ({
      tests:
        tests.filter(({ logs }) => logs?.length),
      ...rest
    }))
    .map(formatTests)
    .join('\n'))}`

const formatFileSummary = (files: File[]) => `
${chalk.reset(`Summary:`)}
${files
  .map(({ name, tests }) => {
    const isFinished = tests.every(({ type }) => !!type)
    const finishedTests = tests.filter(({ type }) => type)
    const erroredTests =
      tests.filter(({ logs }) =>
        logs?.some(({ error }) => !!error))
    const hasErrors = erroredTests.length
    const successful = hasErrors ? `(${finishedTests.length - erroredTests.length})` : ''
    return chalk.reset[
      !isFinished ? 'gray'
      : hasErrors ? 'red'
      : 'green'](`${prettifyPath(name)} ${finishedTests.length}${successful}/${tests.length}`)
  })
  .map(str => ` ${str}`)
  .join('\n')}`


const format = (files: File[]) => `
${formatAnalyzing(files)}\
${formatLogs(files)}\
${formatFileSummary(files)}`

export default
  options =>
    scan((state: { bundle, files: File[] }, val: File | Context) => {
      if (val.name === 'buildStart') {
        logger.clear()
        logger.progress(`\n${chalk.grey(`Bundling...`)}`)
        return { files: [] }
      } else if (val.name === 'bundled') {
        logger.progress(`\n${chalk.grey(`Bundled`)}`)
        return { bundle: (<Context>val).bundle, ...state }
      }
      const file = <File>val
      const { files } = state

      const foundFile = files.find(({ name }) => val.name === name)
      const currentFile = foundFile || file

      if (file.type === FileType.ANALYZE) {

        const foundFile = files.find(({ name }) => val.name === name)
        if (!foundFile) files.push(file)
        else Object.assign(foundFile, file)

      } else if(file.type === FileType.TEST) {

        if (!currentFile.tests) currentFile.tests = []

        const test: Test = file.test
        const foundTest = currentFile.tests.find(({ description }) => test.description === description)

        if (foundTest) Object.assign(foundTest, test)
        else if (!foundTest) currentFile.tests.push(test)

      } else if(file.type === FileType.POST_ANALYZE) {

        if (!currentFile.tests) currentFile.tests = []

        const test: Test = file.test
        const foundTest = currentFile.tests.find(({ description }) => test.description === description)

        if (foundTest) Object.assign(foundTest, test)
        else if (!foundTest) currentFile.tests.push(test)

        const fileIsDone =
          currentFile.tests.every(test => 'value' in test)

        currentFile.type = fileIsDone ? FileType.DONE : FileType.POST_ANALYZE
      }

      const isFinished =
        files.length &&
        files.every(({ type }) =>
          FileType.DONE === type)

      logger[isFinished ? 'success' : 'progress'](format(files))

      return state
    }, undefined)
