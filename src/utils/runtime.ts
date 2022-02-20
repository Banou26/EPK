
export type Global = 'messages' | 'sendMessage'

export const toGlobal = (globalVariableName: Global) => `__epk_${globalVariableName}__`

export type TASK = 'register' | 'run'

export type EVENT = 'log' | 'register' | 'run' | 'runs' | 'error'

export type Task<T extends TASK = TASK> = {
  type: T
  data:
    T extends 'register' ? undefined :
    T extends 'run' ? { tests: string[] } :
    never
}

export type Event<T extends EVENT = EVENT> = {
  type: T
  data:
    T extends 'log' ? { type: string, args: any[] } :
    T extends 'error' ? { message: string, stack: string } :
    T extends 'register' ? { tests: any[] } :
    T extends 'run' ? { test: any[] } :
    T extends 'runs' ? { tests: any[] } :
    never
}
