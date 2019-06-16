import { Text, Box, Color } from 'ink'
import React, { useEffect, useState } from 'react'
import BorderBox from 'ink-box'
import { TestFileRuntimeAggregation } from '../../types.ts'
import File from './file.tsx'

interface State {
  testFiles: Map<string, TestFileRuntimeAggregation>
}

export default ({ subject }) => {
  const [state, setState] = useState<State>({
    testFiles: new Map()
  })
  const [error, setError] = useState<Error>()

  useEffect(() => {
    const subscription =
      subject.subscribe(
        report => setState(report),
        error => setError(error))
    return () => subscription.unsubscribe()
  }, [])

  return <Box>
    {
      state.testFiles.size &&
      <BorderBox borderStyle="round">
        {
          Array.from(state.testFiles).map(([,testFile]) =>
            <File key={testFile.name} testFile={testFile}/>)
        }
      </BorderBox> || ''
    }
    {
      error &&
      <Color red>
        <Box flexDirection="column">
          <Box padding={1}>An internal error with EPK happened, you should probably report this error here https://github.com/FKN48/EPK/issues</Box>
          <Box>{error.stack}</Box>
        </Box>
      </Color>
    }
  </Box>
}
