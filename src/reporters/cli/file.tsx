import React from 'react'
import { Box} from 'ink'

import { prettifyPath } from '../../utils/file.ts'
import { TestFileRuntimeAggregation } from '../../types'
import ColorPipe from 'ink-color-pipe'
import Spinner from './spinner.tsx'
import { getTestFileAggregationStats } from '../../utils/file.ts'

export default ({ testFile: testFileAggregation }: { testFile: TestFileRuntimeAggregation }) => {
  const {isPreprocessed, testedTest, totalTests} = getTestFileAggregationStats(testFileAggregation)

  return <Box>
    <ColorPipe styles="greenBright">
      {prettifyPath(testFileAggregation.name)} {isPreprocessed ? `${testedTest}/${totalTests}` : <Spinner></Spinner>}
    </ColorPipe>
  </Box>
}
