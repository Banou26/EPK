import React from 'react'
import { Text, Box, Color } from 'ink'

import { prettifyPath } from '../../utils/file.ts'
import { TestFile, TestFileRuntimeAggregation, RUNTIME, Test } from '../../types'
import { brightGreen } from './colors.ts'
import Spinner from './spinner.tsx'

export default ({ testFile: testFileAggregation }: { testFile: TestFileRuntimeAggregation }) => {
  const tests: Test[] | undefined = testFileAggregation?.tests
  const runtimeTestFiles = Array.from(testFileAggregation.testFiles.values())
  const testedTestsArray =
    testFileAggregation.tests
      ?.filter(({ description }) =>
        runtimeTestFiles
          .every(testFiles =>
            testFiles.tests
              ?.some(({ description: _description, executionEnd }) =>
                _description === description &&
                executionEnd)))
      || []

  const isPreprocessed = testFileAggregation.tests
  const testedTest = testedTestsArray.length
  const totalTests = testFileAggregation.tests?.length || 0

  // todo: replace green by greenBright when ink will fix it
  return <Box>
    <Color rgb={isPreprocessed && testedTest === totalTests && brightGreen }>
      {prettifyPath(testFileAggregation.name)} {isPreprocessed ? `${testedTest}/${totalTests}` : <Spinner></Spinner>}
    </Color>
  </Box>
}
