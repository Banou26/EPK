import { from, GroupedObservable, Observable } from 'rxjs'

import React, { Fragment, useEffect, useState } from 'react'
import { Box, render, Text } from 'ink'
import { groupBy, map, mergeMap, scan, tap } from 'rxjs/operators'
import { relative, sep } from 'path'
import { cwd } from 'process'
import { parse } from 'path'

// const groupByFile =
  // () =>
  //   (observable: GroupedObservable<any, any>) =>
  //     observable
  //       .pipe(
  //         scan(
  //           (events, event) =>
  //             event.type === 'build' && event.name === 'success'
  //               ? [event]
  //               : [...events, event]
  //           , []
  //         ),
  //         map(events => ({
  //           path: observable.key,
  //           events
  //         }))
  //       )

const TestFileTitle = ({ file: { path, events, groupsTestsRuns, testsRuns } }) => {
  const suceededTests = [
    ...testsRuns,
    ...groupsTestsRuns.flatMap(({ tests }) => tests),
  ].filter(({ status }) => status === 'success')

  const failedTests = [
    ...testsRuns,
    ...groupsTestsRuns.flatMap(({ tests }) => tests),
  ].filter(({ status }) => status === 'fail')

  const skippedTests = [
    ...testsRuns,
    ...groupsTestsRuns.flatMap(({ tests }) => tests),
  ].filter(({ status }) => status === 'skip')

  return (
    <Text>
      {
        (suceededTests.length || failedTests.length)
          ? <Text backgroundColor={failedTests.length ? 'redBright' : ''} color={failedTests.length ? '#000' : 'green'}> {failedTests.length ? 'FAIL' : 'PASS'} </Text>
          : (
            skippedTests.length
              ? <Text color="grayBright"> SKIP </Text>
              : null
          )
      }
      <Text>
        <Text color="gray">{parse(relative(cwd(), path)).dir}{sep}</Text>
        <Text color="white">{parse(relative(cwd(), path)).name}{parse(relative(cwd(), path)).ext}</Text>
      </Text>
      <Text color="white"> (</Text>
      <Text color="greenBright">
        {suceededTests.length}
      </Text>
      <Text color="white">/</Text>
      <Text color="redBright">
        {failedTests.length}
      </Text>
      <Text color="white">/</Text>
      <Text color="grayBright">
        {skippedTests.length}
      </Text>
      <Text color="white">)</Text>
    </Text>
  )
}

const TestFileTest = ({ file, test, ...rest }) => {

  if (test.status === 'success') {
    return (
      <Box flexDirection="column">
        <Text color="green">
          {test.name} ✓
        </Text>
      </Box>
    )
  }

  if (test.status === 'skip') {
    return (
      <Box flexDirection="column">
        <Text color="gray">
          {test.name}
        </Text>
      </Box>
    )
  }

  return (
    <Box flexDirection="column">
      <Text color="red">
        {test.name} ✗
      </Text>
      <Box flexDirection="column" paddingLeft={2}>
        <Text color="grayBright">{test.error.stack.slice(0, test.error.stack.indexOf('\n') + 1).trim()}</Text>
        <Text color="gray">{test.error.stack.slice(test.error.stack.indexOf('\n') + 1).trim()}</Text>
      </Box>
    </Box>
  )
}

const TestFileTests = ({ file, file: { groupsTestsRuns, testsRuns } }) => {

  return (
    <Fragment>
      {
        groupsTestsRuns
          .map(({ name, tests }) =>
            <Box key={name} flexDirection="column">
              <Text color="grayBright">{name}</Text>
              <Box flexDirection="column" paddingLeft={2}>
              {
                tests.map(({ test, ...rest }) =>
                  <TestFileTest
                    key={test.name}
                    file={file}
                    test={{ ...test, ...rest }}
                  />
                )
              }
              </Box>
            </Box>
          )
      }
      {
        testsRuns
          .filter(({ status }) => status === 'skip')
          .map(({ test, ...rest }) =>
            <TestFileTest
              key={test.name}
              file={file}
              test={{ ...test, ...rest }}
            />
          )
      }
      {
        testsRuns
          .filter(({ status }) => status === 'success')
          .map(({ test, ...rest }) =>
            <TestFileTest
              key={test.name}
              file={file}
              test={{ ...test, ...rest }}
            />
          )
      }
      {
        testsRuns
          .filter(({ status }) => status === 'fail')
          .map(({ test, ...rest }) =>
            <TestFileTest
              key={test.name}
              file={file}
              test={{ ...test, ...rest }}
            />
          )
      }
    </Fragment>
  )
}

const TestFile = ({ file, file: { path, events }, ...rest }) => {

  return (
    <Fragment>
      <TestFileTitle file={file}/>
      <Box flexDirection="column" paddingLeft={2}>
        <Box flexDirection="column">
          {
            events
              .filter(event => event.type === 'log')
              .map(({ data: { error, warn, info, log } }, i) =>
                <Fragment key={i}>
                  {
                    error ? <Text><Text color="redBright">err</Text>{error}</Text> :
                    warn ? <Text><Text color="yellowBright">wrn</Text>{warn}</Text> :
                    info ? <Text><Text color="cyanBright">inf</Text>{info}</Text> :
                    log ? <Text><Text color="whiteBright">log</Text>{log}</Text> :
                    null
                  }
                </Fragment>
              )
          }
        </Box>
        <Box flexDirection="column">
          <TestFileTests file={file}/>
        </Box>
      </Box>
    </Fragment>
  )
}

const Mount = ({ observable }: { observable: Observable<any> }) => {
  const [configTestsResults, setConfigTestsResults] = useState([])

  useEffect(() => observable.subscribe(setConfigTestsResults), [])

  return (
    <>
    {
      configTestsResults.configs?.map(({ name, files }) =>
        <Fragment key={`${name}`}>
          <Text color="grayBright">[{name}]</Text>
          <Box flexDirection="column" paddingLeft={1}>
          {
            files.map((file) =>
              <TestFile key={file.path} file={file}/>
            )
          }
          </Box>
        </Fragment>
      )
    }
    </>
  )
}

export default () =>
  (observable: Observable<any>) => {
    render(<Mount observable={observable}/>)
    return observable
  }
