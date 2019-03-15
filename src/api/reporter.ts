import { switchMap } from 'rxjs/operators'
import { Observable } from 'rxjs'
import logger from '../cli/logger'
import { Context, Options } from '../types'
import chalk from 'chalk'
import { prettifyTime, prettifyPath } from './utils'

const formatTest = ({ description, error: { message } }) => `\
 ${description}
 ${chalk.gray(
    message
      .split('\n')
      .shift()
      .trim())}

${chalk.red(
    message
      .split('\n')
      .splice(2)
      .join('\n'))}`


const formatTests = tests => `\
${chalk.underline(prettifyPath(tests[0].sourcePath))}

${tests
    .map(formatTest)
    .join('\n')}`


const format = (buildTime, analyzeTime, testTime, groupedTests) => `
${chalk.green(`Built in ${buildTime}.`)}
${chalk.green(`Analyzed in ${analyzeTime}.`)}
${chalk.green(`Tested in ${testTime}.`)}
${chalk.reset.red(`Errors:`)}

${chalk.reset(
    groupedTests
      .map(([url, tests]) => [
          url,
          tests
            .filter(test => test.error)
        ])
      .map(([, tests]) => formatTests(tests))
      .join('\n'))}`

const logReport = ({ tests, finished, bundledTime, buildStartTime, analyzeEndTime, analyzeStartTime, testEndTime, testStartTime }) =>
  logger[
    finished
      ? 'success'
      : 'progress'
  ](
    format(
      prettifyTime(bundledTime - buildStartTime),
      prettifyTime(analyzeEndTime - analyzeStartTime),
      prettifyTime(testEndTime - testStartTime),
      Object.entries(
        (tests || [])
          .reduce((obj, test) =>
            (obj[test.url]
              ? obj[test.url].push(test)
              : obj[test.url] = [test]
            , obj), {}))
    )
  )

const makeReport = ({ files, bundledTime, buildStartTime, analyzeEndTime, analyzeStartTime, testEndTime, testStartTime }) => ({
  files,
  finished: false,
  bundledTime,
  buildStartTime,
  analyzeEndTime,
  analyzeStartTime,
  testEndTime,
  testStartTime
})

export default
  ({ cli }: Options) => {
    const files: File[] = []

    return switchMap((ctx: Context) =>
      Observable.create(observer => {
        const report = makeReport(ctx)
        if (cli) logReport(report)
        observer.next(report)
        return _ => {}
      }))
  }
