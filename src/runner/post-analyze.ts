import chalk from 'chalk'
import { switchMap,tap } from 'rxjs/operators'
import { of } from 'rxjs'
import { prettifyPath, prettifyTime} from './utils'
import logger from './logger'

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
      .map(([sourcePath, tests]) => [
          sourcePath,
          tests
            .filter(test => test.error)
        ])
      .map(([, tests]) => formatTests(tests))
      .join('\n'))}`

export default
  switchMap(val =>
    of(val)
    |> tap(ctx => {
        ctx.testEndTime = Date.now()
        const { entryPoints, buildStartTime, bundledTime, analyzeEndTime, analyzeStartTime, testStartTime, testEndTime, testsResult } = ctx
        format(
          prettifyTime(bundledTime - buildStartTime),
          prettifyTime(analyzeEndTime - analyzeStartTime),
          prettifyTime(testEndTime - testStartTime),
          Object.entries(
            testsResult
              .reduce((obj, test) =>
                (obj[test.sourcePath]
                  ? obj[test.sourcePath].push(test)
                  : obj[test.sourcePath] = [test]
                , obj), {}))
        )
        |> logger.success
    }))
