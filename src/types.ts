// import { Observable } from "rxjs"

export interface Context {
  bundle: any
}

export interface AnalyzedContext extends Context {
  tests: Test[]
}

export interface TestedContext extends AnalyzedContext {
  testsResults: TestResult[]
  testsCoverage: any
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