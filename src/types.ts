import type { BuildOptions, Message, OutputFile } from 'esbuild'
import type { BrowserType } from 'playwright'

import { devices } from 'playwright'

export type Environment = 'web' | 'content-script' | 'background-script'
export type Platform = 'node' | 'chromium'
export type LogLevel = 'none' | 'error' | 'warn' | 'info' | ''

export type Hook<Runtime> = {
  name: string
  function: Runtime extends true ? ((...args: any[]) => any) : string
  each?: boolean
}

export type TestOptions = {
  skip?: boolean
  only?: boolean
  serial?: boolean
  isolate?: boolean
}

export type Test<Runtime extends boolean = false> =
  TestOptions &
  {
    name: string
    function: Runtime extends true ? ((...args: any[]) => any) : string
  }

export type TestRun<Runtime extends boolean = false> = {
  test: Test<Runtime>
  function: Runtime extends true ? ((...args: any[]) => any) : string
  status: 'success' | 'fail' | 'skip'
  return?: any
  originalStack?: string[]
  errorStack?: any[]
}

export type GroupOptions = {
  skip?: boolean
  only?: boolean
}

export type Group<Runtime extends boolean = false> =
  GroupOptions &
  {
    useFunction?: (...args) => any
    useArguments?: any[]
    name: string
    function: Runtime extends true ? ((...args: any[]) => any) : string
    tests: Test<Runtime>[]
    hooks: Hook<Runtime>[]
  }

export type GroupRun<Runtime extends boolean = false> = {
  name: string
  function: Runtime extends true ? ((...args: any[]) => any) : string
  tests: TestRun<Runtime>[]
  hooks: Hook<Runtime>[]
}

export type TestFile = {
  path: string
  groups: Group[]
  tests: Test[]
}

export type EPKConfig = {
  workers?: number
  configs: TestConfig[]
}

export { devices }
export type Devices = typeof devices

export type TestConfig = {
  name: string
  platform: Platform
  setup?: () => any,
  teardown?: () => any,
  device?: Devices[string]
  browserConfig?: Parameters<BrowserType<{}>['launchPersistentContext']>[1]
  extensions?: string[]
  initReloadExtensions?: boolean
  extensionManifest?: {
    // manifest here
  },
  maxContexts?: number
  web?: {
    match: string[]
  },
  contentScript?: {
    match: string[]
  },
  backgroundScript?: {
    match: string[]
  },
  logLevel?: LogLevel
  esbuild?: BuildOptions
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
//   groupName?: string
//   name: string
//   function: (args: any) => any
//   result?: any
//   originalStack?: string[]
//   errorStack?: any[]
//   slow: boolean,
//   urls?: string[]
// }

// export type Group = {
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

// export type RunnerGroup = ReplaceTestWithTestRunner<Group>

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
//     groups: Group[]
//   }>

// export type EnvironmentIndex = {
//   environment: EnvironmentConfig,
//   files: TestFile[]
// }
