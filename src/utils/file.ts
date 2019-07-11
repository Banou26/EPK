
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { Test, TestFileRuntimeAggregation } from '../types';

const _access = promisify(fs.access)

export const cwd = process.cwd()

export const access =
  (filename, _path = '') =>
    _access(path.resolve(_path, filename), fs.constants.F_OK)
      .then(
        () => true,
        () => false)

export const prettifyPath = _path => path.relative(cwd, _path)

export const getEmptyPageUrl = port =>
  pathToEpkUrl(path.resolve(__dirname, '..', 'dist', 'empty.html'), port)

export const pathToTestUrl = (_path, { outDir = '.epk', port = undefined }) =>
  `${port ? `http://localhost:${port}` : ''}${path.normalize(_path).replace(`${path.resolve(cwd, outDir, 'dist')}${path.sep}`, '/tests/').replace(path.sep, '/')}`

export const pathToEpkUrl = (_path, { port }) =>
  `${port ? `http://localhost:${port}` : ''}${path.normalize(_path).replace(`${path.resolve(__dirname, '..', 'lib')}${path.sep}`, '/epk/').replace(path.sep, '/')}`

export const getTestFileAggregationStats =  (testFileAggregation: TestFileRuntimeAggregation) => {
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

  return {
    tests,
    runtimeTestFiles,
    testedTestsArray,
    isPreprocessed,
    testedTest,
    totalTests
  }
}