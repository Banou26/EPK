import { Text, Box, Color } from 'ink'
import React, { useEffect, useState } from 'react'
import { TestResult } from '../../types.ts'
import File from './file.jsx'

interface State {
  files: TestResult[]
}

export default ({ subject }) => {
  const [state, setState] = useState<State>({
    files: []
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
      state.files.length &&
      <Box>
        {
          state.files.map(file =>
            <File file={file}/>)
        }
      </Box>
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
