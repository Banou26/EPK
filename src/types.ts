
import { Observable, Subject } from 'rxjs'
import { BuildSuccessEvent, BuildFailureEvent, BuildEvent, BundleGraph  } from '@parcel/types'
import { CoverageEntry, ElementHandle } from 'puppeteer'

// Subject that is sent data from the tester to the runtime
export const EPK_SUBJECT = '__EPK__SUBJECT__'
// Subject that is sent data from the runtime to the tester
export const EPK_RUNTIME_SUBJECT = '__EPK__RUNTIME__SUBJECT__'
export const EPK_FUNCTION_PROPERTY_PLACEHOLDER = '__EPK__FUNCTION__PLACEHOLDER__'

export interface Bundler extends Observable<BuildEvent> {}

// Going to change when Parcel 2 get released
export interface Options {
  outDir: string
  entryFiles: string | string[]
  target: TARGET
  watch?: boolean
  browsers?: BROWSER[]
  port?: number
}

export interface installImportOptions {
  path: string
  dev: boolean
}

export interface TestBundle {
  /**
   * Parcel bundle
   */
  parcelBundle: BundleGraph
  /**
   * Entry files
   */
  entryFiles: string[]
  /**
   * Time at which the bundling started(high precision timestamp)
   */
  buildStartTime: number
  /**
   * Time at which the bundling ended(high precision timestamp)
   */
  buildEndTime: number
}

/**
 * Representation of a file
 */
export interface TestFile {
  /**
   * Bundle
   */
  bundle: TestBundle
  /**
   * Hashes of all the parcel assets
   */
  hashes: Set<string>
  /**
   * Path of the source test file
   */
  name: string
  /**
   * Prettified path of the source test file
   */
  displayName: string
  /**
   * Path of the bundled test file
   */
  path: string
  /**
   * Target
   */
  target: TARGET | RUNTIME
  /**
   * Url by which browsers can access the test file
   * Not defined if target is node
   */
  url?: string
  /**
   * Array of analyzed tests
   */
  tests?: Test[] | undefined
  /**
   * Boolean that equals true if all the tests ran
   */
  testsDone?: boolean
  /**
   * Array of logs logged without running the tests
   */
  logs?: Log[]
  /**
   * Time at which the test preprocessing started(high precision timestamp)
   */
  preprocessingStart?: number
  /**
   * Time at which the test preprocessing ended(high precision timestamp)
   */
  preprocessingEnd?: number
}

export interface TestFileRuntimeAggregation {
/**
   * Bundle
   */
  bundle: TestBundle
  /**
   * Hashes of all the parcel assets
   */
  hashes: Set<string>
  /**
   * Path of the source test file
   */
  name: string
  /**
   * Prettified path of the source test file
   */
  displayName: string
  /**
   * Path of the bundled test file
   */
  path: string
  /**
   * Array of analyzed tests
   */
  tests?: Test[] | undefined
  /**
   * Url by which browsers can access the test file
   * Not defined if target is node
   */
  url?: string
  /**
   * Map of tested file per runtime
   */
  testFiles: Map<RUNTIME, TestFile>
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
   * Body of the test (Stringified function)
   */
  body: string
  /**
   * String type of test: Function | Promise<any> | Observable<any>
   */

  //** Properties from the test when executed
  
  type?: string
  /**
   * Flatted(https://github.com/WebReflection/flatted) value returned by the test
   */
  value?: any
  /**
   * Array of logs logged while running the test
   */
  logs?: Log[]
  /**
   * Time at which the test started(high precision timestamp)
   */
  executionStart?: number
  /**
   * Time at which the test ended(high precision timestamp)
   */
  executionEnd?: number
  /**
   * Code coverage of the test
   * Can be undefined if environment doesn't support native Coverage (in browser)
   * todo: think of using instanbul for in browser coverage when parcel v2 will be released
   */
  coverage?: CoverageEntry

  //** Properties from the test when analyzed
  /**
   * Percent of code run by the test from the file
   */
  codeCoverage?: number
  /**
   * Time at which the test analyze started(high precision timestamp)
   */
  analyzeStart?: number
  /**
   * Time at which the test analyze ended(high precision timestamp)
   */
  analyzeEnd?: number
}

export interface Analyze {

}

export enum MESSAGE {
  GET_TESTS,
  GET_TESTS_RESPONSE,
  
  RUN_TESTS,
  RUN_TESTS_RESPONSE,

  RUN_TEST,
  RUN_TEST_RESPONSE
}

const messageMap = new Map<MESSAGE, MESSAGE>([
  [MESSAGE.GET_TESTS, MESSAGE.GET_TESTS_RESPONSE],
  [MESSAGE.RUN_TESTS, MESSAGE.RUN_TESTS_RESPONSE],
  [MESSAGE.RUN_TEST, MESSAGE.RUN_TEST_RESPONSE]
])

export const getMessageResponse = message => messageMap.get(message)

// https://github.com/parcel-bundler/parcel/issues/2574#issuecomment-459694774
export enum PARCEL_REPORTER_EVENT {
  BUILD_START = 'buildStart',
  BUILD_PROGRESS = 'buildProgress',
  BUILD_SUCCESS = 'buildSuccess',
  BUILD_FAILURE = 'buildFailure',
  LOG = 'log'
}

export enum REPORTER_EVENT {
  BUILD_START = 'buildStart',
  BUILD_PROGRESS = 'buildProgress',
  BUILD_SUCCESS = 'buildSuccess',
  BUILD_FAILURE = 'buildFailure',
  LOG = 'log',
  PORT_SEARCH = 'portSearch',
  PORT_FOUND = 'portFound',
  WEB_SERVER_START = 'webServerStart',
  WEB_SERVER_READY = 'webServerReady',
  STATE = 'state'
}

export enum TARGET {
  BROWSER = 'browser',
  NODE = 'node'
}

export enum BROWSER {
  FIREFOX = 'firefox',
  FIREFOX_NIGHTLY = 'firefoxNightly',
  CHROME = 'chrome',
  CHROME_CANARY = 'chromeCanary'
}

export enum RUNTIME {
  FIREFOX = 'firefox',
  FIREFOX_NIGHTLY = 'firefoxNightly',
  CHROME = 'chrome',
  CHROME_CANARY = 'chromeCanary',
  NODE = 'node'
}

export interface RuntimeProvider extends Observable<Runtime> {
  runtimeName: RUNTIME
}

export interface Runtime extends Observable<any> {
  loadFile(file: TestFile): Promise<ElementHandle>
  inMessages: Subject<any>
  outMessages: Subject<any>
}

export enum LOG {
  log = 'log',
  info = 'info',
  warn = 'warn',
  error = 'error',
  uncaughtError = 'uncaughtError'
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

export interface Log {
  type: LOG
  arguments?: any[]
  error?: Error
}
