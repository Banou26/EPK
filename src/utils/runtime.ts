import { Test, TestRun } from '../types'

export type Global = 'task' | 'event' | 'initDone'

export const toGlobal = (globalVariableName: Global) => `__epk_${globalVariableName}__`

export type TASK = 'register' | 'run'

export type EVENT = 'log' | 'register' | 'run' | 'runs' | 'error'

export type Task<T extends TASK = TASK> = {
  type: T
  data:
    T extends 'register' ? undefined :
    T extends 'run' ? { tests: Test[] } :
    never
}

export type Event<T extends EVENT = EVENT> = {
  type: T
  data:
    T extends 'log' ? { type: string, args: any[] } :
    T extends 'error' ? { message: string, stack: string[], errorStack?: any[] } :
    T extends 'register' ? { tests: Test[] } :
    T extends 'run' ? { test: TestRun } :
    T extends 'runs' ? { tests: TestRun[] } :
    never
}
