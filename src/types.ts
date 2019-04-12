/* eslint-disable no-unused-vars */

import { Observable } from 'rxjs'
import { ElementHandle } from 'puppeteer'

export const NODE_GLOBAL = '__EPK_NODE_GLOBAL'

/**
 * List of different runtimes (available) to test on
 */
export enum TARGET {
  NODE = 'node',
  ELECTRON = 'electron',
  DENO = 'deno',
  CHROME = 'chrome',
  CHROME_EXTENSION = 'chromeExtension',
  CHROME_CANARY = 'chromeCanary',
  CHROME_CANARY_EXTENSION = 'chromeCanaryExtension',
  FIREFOX = 'firefox',
  FIREFOX_EXTENSION = 'firefoxExtension',
  FIREFOX_NIGHTLY = 'firefoxNightly',
  FIREFOX_NIGHTLY_EXTENSION = 'firefoxNightlyExtension'
}

export enum BROWSER_TARGET {
  CHROME = TARGET.CHROME_EXTENSION,
  CHROME_EXTENSION = TARGET.CHROME_CANARY,
  CHROME_CANARY = TARGET.CHROME_CANARY_EXTENSION,
  CHROME_CANARY_EXTENSION = TARGET.FIREFOX,
  FIREFOX = TARGET.FIREFOX_EXTENSION,
  FIREFOX_EXTENSION = TARGET.FIREFOX_NIGHTLY,
  FIREFOX_NIGHTLY = TARGET.FIREFOX_NIGHTLY_EXTENSION,
  FIREFOX_NIGHTLY_EXTENSION = TARGET.FIREFOX_NIGHTLY_EXTENSION
}

export enum BUNDLER_TARGET {
  NODE = 'node',
  BROWSER = 'browser',
  ELECTRON = 'electron'
}

export const targetToBundlerTarget =
  (target: TARGET): BUNDLER_TARGET =>
    target in BROWSER_TARGET
      ? BUNDLER_TARGET.BROWSER
      : target as unknown as BUNDLER_TARGET === BUNDLER_TARGET.NODE
        ? BUNDLER_TARGET.NODE
        : target as unknown as BUNDLER_TARGET === BUNDLER_TARGET.ELECTRON && BUNDLER_TARGET.NODE

export interface Bundler extends Observable<any> {}

export interface TargetRuntime extends Observable<any> {
  loadFile(file: File): Promise<ElementHandle>
  exec(str: string): Promise<any>
}
export interface TargetRuntimeObservable extends Observable<TargetRuntime> {
  target: TARGET
  options: TargetRuntimeOptions
}

export interface TargetRuntimeOptions {}
export interface TargetRuntimeProvider extends Observable<TargetRuntimeObservable> {
  target: TARGET
  options: TargetRuntimeOptions
}
export interface TargetRuntimeProviderOptions {}

export enum MESSAGE_TYPE {
  GET_TESTS = '__EPK_GET_TESTS',
  RUN_TESTS = '__EPK_RUN_TESTS',
  RUN_TEST = '__EPK_RUN_TEST',
  GET_TESTS_RESPONSE = '__EPK_GET_TESTS_RESPONSE',
  RUN_TESTS_RESPONSE = '__EPK_RUN_TESTS_RESPONSE',
  RUN_TEST_RESPONSE = '__EPK_RUN_TEST_RESPONSE'
}

export interface Message {
  type: MESSAGE_TYPE,
  payload: any
}

export interface Options {
  browsers?: BROWSER_TARGET[]
  entryFiles: string[]
  target: BUNDLER_TARGET
  watch?: boolean
  outDir?: string
  cache?: boolean
  cacheDir?: string
  minify?: boolean
  scopeHoist?: boolean
  /**
   * 0 = log nothing
   * 1 = log errors
   * 2 = log warnings & errors
   * 3 = log everything
   */
  logLevel?: 0 | 1 | 2 | 3
  sourceMaps?: boolean
  detailedReport?: boolean
}

export interface Target {
  type: TARGET
  test: Function
  prepare: Function
}

/**
 * Context object of the testing pipeline that contains all the information needed for each testing steps
 */
export interface Context {
  /**
   * Options passed to epk
   */
  options: Options
  /**
   * Files found by the paths/globs
   */
  files: File[]
  /**
   * entryFiles from Parcel
   */
  entryFiles?: string[]
  /**
   * Array of targets in which the tests will be executed
   */
  targets: TARGET[]
  name: string
  bundle: any
  buildStartTime?: number
  buildEndTime?: number
  analyzeEndTime?: number
  analyzeStartTime?: number
  testStartTime?: number
  testEndTime?: number
}

export enum FileType {
  ANALYZE = 'ANALYZE',
  TEST = 'TEST',
  POST_ANALYZE = 'POST_ANALYZE',
  DONE = 'DONE'
}

export interface MetaStack {
  file: string
  source: string
  name: string
  line: number
  column: number
  originalSource: string
  originalName: string
  originalLine: number
  originalColumn: number
}

export interface Error {
  message: string
  name: string
  stack: string
  string: string
  metaStack?: MetaStack[]
  originalStack?: string
}

export enum LogType {
  log = 'log',
  info = 'info',
  warn = 'warn',
  error = 'error',
  uncaughtError = 'uncaughtError'
}

export interface Log {
  type: LogType
  arguments?: any[]
  error?: Error
}

/**
 * Representation of a file
 */
export interface File {
  type?: FileType

  target: TARGET
  /**
   * Path of the source test file
   */
  name: string
  /**
   * Path of the bundled test file
   */
  path: string
  /**
   * Url by which browsers can access the test file
   */
  url?: string
  /**
   * Test ran
   */
  test?: Test
  /**
   * Array of analyzed tests
   */
  tests?: Test[]
  /**
   * Array of errors
   */
  logs?: Log[]
}

/**
 * Representation of a test
 */
export interface Test {
  /**
   * Description of the test
   */
  description: string
  /**
   * Body of the test (Function stringified)
   */
  body: string
  /**
   * Type of test
   */
  // type?: Function | Promise<any> | Observable<any>
  type?: string
  /**
   * Value returned by the test
   */
  value?: any
  /**
   * Error thrown by the test
   */
  logs?: Log[]

  timeStart?: number

  timeEnd?: number

  /**
   * Target
   */
  target?: TARGET
  /**
   * Code coverage of the test
   */
  coverage?: any
}
