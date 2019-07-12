import path from 'path'

import { Text, Box, Color } from 'ink'
import React, { useEffect, useState } from 'react'
import BorderBox from 'ink-box'
import getStrLength from 'string-width'
import ColorPipe from 'ink-color-pipe'

import File from './file.tsx'
import { prettifyPath } from '../../utils/file.ts'
import { TestFileRuntimeAggregation, TestFile, LOG } from '../../types.ts'

interface State {
  testFiles: Map<string, TestFileRuntimeAggregation>
}

const UP_ARROW = '\u001B[A'
const DOWN_ARROW = '\u001B[B'
const RIGHT_ARROW = '\u001B[C'
const LEFT_ARROW = '\u001B[D'
const CTRL_C = '\x03'

const useError = (subject) => {
  const [error, setError] = useState<Error>()
  useEffect(() => {
    const subscription =
      subject.subscribe(
        () => {},
        error => setError(error))
    return () => subscription.unsubscribe()
  }, [])

  return [
    error,
    error
      ? <Color red>
        <Box flexDirection="column">
          <Box>An internal error happened, you should probably report the error here: https://github.com/FKN48/EPK/issues</Box>
        </Box>
      </Color>
      : ''
  ]
}

const useFilesState = (subject) => {
  const [{ testFiles }, setFilesState] = useState<State>({
    testFiles: new Map()
  })

  useEffect(() => {
    const subscription = subject.subscribe(report => setFilesState(report))
    return () => subscription.unsubscribe()
  }, [])

  return Array.from(testFiles.values())
}

const getRenderableNames = (terminalWidth, names: string[], startAt): [[string, number][], number, boolean] =>
  Array.from(names)
    .splice(startAt)
    .reduce(([list, max, found = false], name, i) =>
      found
        ? [list, max, true]
        : getStrLength(`${list.join(' ')} ${name}`) > terminalWidth
          ? [list, max, true]
          : [[...list, [name, i + startAt]], i + startAt, false]
    , [[], 0, false])

const useTabs = ({ stdin, setRawMode }, aggregatedTestFiles: TestFileRuntimeAggregation[]): [TestFileRuntimeAggregation, JSX.Element] => {
  /**
   * Level 0 = folder
   * Level 1 = file
   */
  const [level, setLevel] = useState<number>(0)
  const [[selected, scroll], setState] = useState<[number, number]>([0, 0])

  const folderTestFileMap =
    aggregatedTestFiles
      .map(({name, displayName}) => [path.dirname(name), displayName])
      .reduce((map, [folder, file]) =>
        (map.get(folder) ||
        map.set(folder, []).get(folder)).push(file) &&
        map
      , new Map<string, string[]>())
      
  const terminalWidth = process.stdout.columns
  const terminalHeight = process.stdout.rows

  const folderNames = Array.from(folderTestFileMap.keys())
  const fileNames = Array.from(folderTestFileMap.values()).flat()

  const names = level ? folderNames : fileNames

  const [, _maxRenderableNames] = getRenderableNames(terminalWidth, names, scroll)

  const needScroller = _maxRenderableNames !== names.length

  const [renderNames, maxRenderableNames] = getRenderableNames(terminalWidth - getStrLength(`⬅️➡️`), names, scroll)

  const handleKeyPress = data => {
    const s = String(data)
    if (s === CTRL_C) {
      setRawMode(false)
      process.exit()
    }
    if (s === RIGHT_ARROW) {
      setState(([selected, scroll]) => [
        selected + (selected < names.length - 1 ? 1 : 0),
        scroll + (selected < names.length - 1 && selected === scroll + maxRenderableNames ? 1 : 0)
      ])
    }
    if (s === LEFT_ARROW) {
      setState(([selected, scroll]) => [
        selected - (selected > 0 ? 1 : 0),
        scroll - (scroll > 0 && selected === scroll ? 1 : 0)
      ])
    }
  }

  useEffect(() => {
    setRawMode(true)
    stdin.on('data', handleKeyPress)
    return () => {
      stdin.removeListener('data', handleKeyPress)
    }
  })

  // remove set raw mode, as it might interfere with CTRL-C
  useEffect(() => () => setRawMode(false), [])
  return [
    aggregatedTestFiles[selected],
    <Box width={terminalWidth} alignItems="center" justifyContent="space-around">
        <Box>
          {
            needScroller &&
            renderNames[0][1] !== 0
              ? '⬅️'
              : ''
          }
        </Box>
        {
          renderNames
            .map(([name, i]) => {
              const testFiles =
                Array.from(
                  aggregatedTestFiles
                    .find(({displayName}) => displayName === name)
                    .testFiles.values())

              const hasErrors =
                testFiles.some(({tests}) =>
                  tests?.some(({logs}) =>
                    logs?.some(({type}) => type === LOG.error)))

              return (
                <Box key={name}>
                  <ColorPipe styles={`${hasErrors ? 'red' : 'greenBright'}${i === selected ? '.bold.underline' : ''}`}>
                    {prettifyPath(name)}
                  </ColorPipe>
                </Box>
              )
            })
            .reverse()
            .reduce((arr, value, i) =>
              i
                ? [...arr, [value, <Text key={i}> </Text>]]
                : [...arr, [value]]
              , [])
            .reverse()
            .flat(Infinity)
        }
        <Box>
          {
            needScroller &&
            renderNames[renderNames.length - 1][1] !== names.length - 1
              ? '➡️'
              : ''
          }
        </Box>
      </Box>
  ]
}

const useTestFile = (aggregatedTestFile: TestFileRuntimeAggregation) => {
  // todo:
  // replace tests because TestFileRuntimeAggregation#tests are analyzed tests,
  // they're not tested so they'll not have execution error logs
  const color =
    aggregatedTestFile?.tests &&
    'executionEnd'
      ? aggregatedTestFile.tests.some(({logs}) => logs?.some(({type}) => type === LOG.error))
        ? 'red'
        : 'greenBright'
      : ''

  return aggregatedTestFile
    ? <Box flexDirection="column">
      <Box>
        <ColorPipe styles={color}>
          {aggregatedTestFile.displayName}
        </ColorPipe>
      </Box>
      <Box  flexDirection="column" paddingLeft={2}>
        {
          aggregatedTestFile.tests?.map(({ description, logs }) => (
            <Box key={description}>
              <ColorPipe
                styles={
                  logs
                    ? logs.some(({type}) => type === LOG.error)
                      ? 'red'
                      : 'greenBright'
                    : ''
                }>
                {description}
              </ColorPipe>
            </Box>
          ))
        }
      </Box>
    </Box>
    : ''
}

export default ({ stdin, setRawMode, subject }) => {
  const [ error, errorElement ] = useError(subject)
  const aggregatedTestFiles = useFilesState(subject)
  const [ selected, tabsElement ] = useTabs({ stdin, setRawMode }, aggregatedTestFiles)
  const fileDescription = useTestFile(selected)
  return <Box flexDirection="column">
    { fileDescription }
    { tabsElement }
    { errorElement }
  </Box>
}

// testFiles.length &&
// Array.from(testFiles).map(testFile =>
//   <File key={testFile.name} testFile={testFile}/>) || ''
// <BorderBox borderStyle="round">
//   {
//     Array.from(state.testFiles).map(([,testFile]) =>
//       <File key={testFile.name} testFile={testFile}/>)
//   }
// </BorderBox> || ''
