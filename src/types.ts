import type { BuildOptions, Message, OutputFile } from 'esbuild'

import type { JSHandle } from 'playwright'

export type Environment = 'web' | 'content-script' | 'background-script'
export type Platform = 'node' | 'chromium'
export type LogLevel = 'none' | 'error' | 'warn' | 'info' | ''

export type Test = {
  name: string
  function: ((args: any) => any) | string
}

export type TestRun = {
  test: Test
  function: ((args: any) => any) | string
  status: 'success' | 'fail'
  return?: any
  originalStack?: string[]
  errorStack?: any[]
}

export type Describe = {
  useFunction?: (...args) => any
  useArguments?: any[]
  name: string
  function: ((...args) => any) | string
  tests: Test[]
}

export type DescribeRun = {
  name: string
  function: ((...args) => any) | string
  tests: TestRun[]
}

export type TestFile = {
  path: string
  describes: Describe[]
  tests: Test[]
}

export type EPKConfig = {
  workers?: number
  configs: TestConfig[]
}

export type TestConfig = {
  name: string
  platform: Platform
  extensions?: string[]
  extensionManifest: {
    // manifest here
  },
  web?: {
    match: string[]
  },
  contentScript?: {
    match: string[]
  },
  backgroundScript?: {
    match: string[]
  },
  logLevel: LogLevel
  esbuild: BuildOptions
}

export type TestConfigRun = {
  config: TestConfig
  files: TestFile[]
}

export type BuildStatus = 'start' | 'success' | 'failure'

export type BuildOutputFile = {
  originalPath: string
  environment: Environment
  file: OutputFile
  sourcemap: OutputFile
}

export type BuildOutput = {
  type: 'build'
  name: BuildStatus
  errors?: Message[]
  outputs?: BuildOutputFile[]
  web?: { filePaths: string[] },
  contentScript?: { filePaths: string[] },
  backgroundScript?: { filePaths: string[] }
}

// type Environment = 'browser' | 'content-script' | 'background-script' | 'service-worker' | 'web-worker' | 'shared-worker'

// export type EnvironmentConfig = {
//   name: string
//   environment: Environment
//   esbuild?: BuildOptions
//   browserTestGlob?: string
//   logLevel?: 'none' | 'error' | 'warn' | 'info'
// }

// export type Test = {
//   path: string
//   describeName?: string
//   name: string
//   function: (args: any) => any
//   result?: any
//   originalStack?: string[]
//   errorStack?: any[]
//   slow: boolean,
//   urls?: string[]
// }

// export type Describe = {
//   name: string
//   urls: string[]
//   tests: Test[]
//   promise: Promise<void>
// }

// export type ReplaceTestWithTestRunner<T> =
//   ReplaceTypeWithType<
//     Test,
//     RunnerTest,
//     T
//   >

// export type RunnerDescribe = ReplaceTestWithTestRunner<Describe>

// export type RunnerTest =
//   Omit<Test, 'function'> & {
//     environmentConfig: EnvironmentConfig
//     function: JSHandle<(args: any) => any>
//   }

// export type ReplaceTypeWithType<T, T2, T3> =
//   T3 extends T
//     ? T2
//     : Required<{
//       [key in keyof T3]:
//         T3[key] extends Record<string | number | symbol, any>
//         ? ReplaceTypeWithType<T, T2, T3[key]>
//         : T3[key] extends T
//             ? T2
//             : T3[key]
//     }>

// export type TestFile =
//   ReplaceTestWithTestRunner<{
//     path: string,
//     tests: Test[],
//     describes: Describe[]
//   }>

// export type EnvironmentIndex = {
//   environment: EnvironmentConfig,
//   files: TestFile[]
// }
