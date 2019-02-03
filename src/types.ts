import { Page as PPTRPage } from 'puppeteer'
import { Observable } from 'rxjs'

// import { Observable } from "rxjs"

export enum BROWSER {
  CHROME = 'Chrome',
  CHROME_CANARY = 'ChromeCanary',
  FIREFOX = 'Firefox',
  FIREFOX_NIGHTLY = 'FirefoxNightly'
}

export enum MESSAGE_TYPE {
  GET_TESTS = '__EPK_GET_TESTS',
  RUN_TESTS = '__EPK_RUN_TESTS',
  RUN_TEST = '__EPK_RUN_TEST'
}

export interface Message {
  type: MESSAGE_TYPE,
  payload: any
}

export interface Options {
  entryFiles: string[]
  browsers: BROWSER[]
}

export interface Context {
  options: Options
  files: File[]
  entryFiles: string[]
  browsers: BROWSER[]
  pageProvider: Observable<PPTRPage>
  name: string
  bundle: any
  buildStartTime: number
  buildEndTime: number
}

export interface BrowserResult {
  browser: BROWSER
  testsResults: TestResult[]
  errors: Error[]
}

export interface File {
  path: string
  url: string
  tests?: Test[]
  browsersResults?: BrowserResult[]
}

export interface AnalyzedContext extends Context {
  analyzeEndTime: number
  analyzeStartTime: number
}

export interface TestedContext extends AnalyzedContext {
  testsCoverage: any
  testStartTime: number
  testEndTime: number
}

export interface Test {
  path: string
  url: string
  description: string
  body: Function
}

export interface TestResult extends Test {
  value?: any
  // type: Function | Promise | Observable
  error?: Error
}
