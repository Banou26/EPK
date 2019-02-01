import { Page as PPTRPage } from 'puppeteer'
import { Observable } from 'rxjs'

// import { Observable } from "rxjs"

export interface Options {
  entryFiles: string[]
}

export interface Context {
  options: Options
  entryFiles: string[]
  pageProvider: Observable<PPTRPage>
  name: string
  bundle: any
  buildStartTime: number
  buildEndTime: number
}

export interface Page {
  tests: Test[]
  testsResults?: TestResult[]
  errors?: Error[]
}

export interface AnalyzedContext extends Context {
  pages: Page[]
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
