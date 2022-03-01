import { from, GroupedObservable, Observable } from 'rxjs'

import React, { Fragment, useEffect, useState } from 'react'
import { Box, render, Text } from 'ink'
import { groupBy, map, mergeMap, scan, tap } from 'rxjs/operators'
import { relative } from 'path'
import { cwd } from 'process'

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

const Mount = ({ observable }: { observable: Observable<any> }) => {
  const [configTestsResults, setConfigTestsResults] = useState([])

  useEffect(() => observable.subscribe(setConfigTestsResults), [])

  return (
    <>{
      configTestsResults.configs?.map(({ name, files }) =>
        <Fragment key={`${name}`}>
          <Text color="grayBright">[{name}]</Text>
          <Box flexDirection="column" paddingLeft={1}>{
            files.map(({ path, events }) =>
              <Fragment key={`${path}`}>
                <Text>
                  <Text color="white">{relative(cwd(), path)} </Text>
                  <Text color="white">(</Text>
                  <Text color="greenBright">
                    {
                      events
                        .filter(event => event.type === 'runs')
                        .flatMap(({ testsRuns }) => testsRuns)
                        .filter(({ status }) => status === 'success')
                        .length
                    }
                  </Text>
                  <Text color="white">/</Text>
                  <Text color="redBright">
                    {
                      events
                        .filter(event => event.type === 'runs')
                        .flatMap(({ testsRuns }) => testsRuns)
                        .filter(({ status }) => status === 'fail')
                        .length
                    }
                  </Text>
                  <Text color="white">/</Text>
                  <Text color="grayBright">
                    {
                      events
                        .filter(event => event.type === 'runs')
                        .flatMap(({ testsRuns }) => testsRuns)
                        .filter(({ status }) => status === 'skipped')
                        .length
                    }
                  </Text>
                  <Text color="white">)</Text>
                </Text>
                <Box flexDirection="column" paddingLeft={2}>
                  <Box flexDirection="column">
                    {
                      events
                        .filter(event => event.type === 'log')
                        .map(({ error, warn, info, log }, i) =>
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
                    {
                      events
                        .filter(event => event.type === 'runs')
                        .map(({ testsRuns }, i) =>
                          <Fragment key={i}>
                            {
                              testsRuns
                                .filter(({ status }) => status === 'success')
                                .map(({ test, status, error }) =>
                                  <Box key={test.name} flexDirection="column">
                                    <Text color="green">
                                      {test.name} ✓
                                    </Text>
                                  </Box>
                                )
                            }
                            {
                              testsRuns
                                .filter(({ status }) => status === 'fail')
                                .map(({ test, status, error }) =>
                                  <Box key={test.name} flexDirection="column">
                                    <Text color="red">
                                      {test.name} ✗
                                    </Text>
                                    <Box flexDirection="column" paddingLeft={2}>
                                      <Text color="redBright">{error.stack}</Text>
                                    </Box>
                                  </Box>
                                )
                            }
                          </Fragment>
                        )
                    }
                  </Box>
                </Box>
              </Fragment>
            )
          }</Box>
        </Fragment>
      )
    }</>
  )
}

export default () =>
  (observable: Observable<any>) => {
    render(<Mount observable={observable}/>)
    return observable
  }
