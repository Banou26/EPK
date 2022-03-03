import { Describe, DescribeRun, Test, TestRun } from '../types'

export type Global = 'task' | 'event' | 'initDone'

export const toGlobal = (globalVariableName: Global) => `__epk_${globalVariableName}__`

export type TASK = 'register' | 'run'

export type EVENT = 'log' | 'register' | 'run' | 'runs' | 'error'

export type Task<T extends TASK = TASK> = {
  type: T
  data:
    T extends 'register' ? undefined :
    T extends 'run' ? { describes: Describe[], tests: Test[] } :
    never
}

export type Event<T extends EVENT = EVENT> = {
  type: T
  data:
    T extends 'initDone' ? {  } :
    T extends 'log' ? { type: string, args: any[] } :
    T extends 'error' ? { message: string, stack: string[], errorStack?: any[] } :
    T extends 'register' ? { tests: Test[], describes: Describe[] } :
    T extends 'run' ? { describe: DescribeRun, test: TestRun } :
    T extends 'runs' ? { describes: DescribeRun[], tests: TestRun[] } :
    never
}

export type TASK_EVENTS = {
  'register': Event<'log'> | Event<'error'> | Event<'register'>
  'run': Event<'log'> | Event<'error'> | Event<'run'> | Event<'runs'>
}

export type TaskEvents<T extends TASK = TASK> = TASK_EVENTS[T]
