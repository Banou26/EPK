import type { Group, GroupRun, Hook, Test, TestRun } from '../types'
import type { Extension } from '../platforms/chromium/types'

export type Global = 'task' | 'event' | 'initDone' | 'epkEval' | 'epkEvalHandle'

export const toGlobal = (globalVariableName: Global) => `__epk_${globalVariableName}__`

export type TASK = 'register' | 'run'

export type EVENT = 'log' | 'register' | 'run' | 'error'

export type Task<T extends TASK = TASK, Runtime extends boolean = false> = {
  type: T
  data:
    T extends 'register' ? undefined :
    T extends 'run' ? { groups: Group<Runtime>[], tests: Test<Runtime>[], extensions: Extension[] } :
    never
}

export type Event<T extends EVENT = EVENT, Runtime extends boolean = false> = {
  type: T
  data:
    T extends 'initDone' ? undefined :
    T extends 'log' ? { error: string } | { warn: string } | { info: string } | { log: string } :
    T extends 'error' ? { message: string, stack: string[], errorStack?: any[] } :
    T extends 'register' ? { tests: Test<Runtime>[], groups: Group<Runtime>[], hooks: Hook<Runtime>[] } :
    T extends 'run' ? { group?: GroupRun<Runtime>, test?: TestRun<Runtime> } | { groups?: GroupRun<Runtime>[], tests?: TestRun<Runtime>[], done?: boolean } :
    never
}

export type TASK_EVENTS = {
  'register': Event<'log'> | Event<'error'> | Event<'register'>
  'run': Event<'log'> | Event<'error'> | Event<'run'>
}

export type TaskEvents<T extends TASK = TASK> = TASK_EVENTS[T]
