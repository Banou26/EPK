// import { Observable } from "rxjs"

export interface Context {
  entryPoints: string[]
  bundle: any
  buildStartTime: number
  bundledTime: number
}

export interface AnalyzedContext extends Context {
  tests: Test[]
  analyzeEndTime: number
  analyzeStartTime: number
}

export interface TestedContext extends AnalyzedContext {
  testsResults: TestResult[]
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