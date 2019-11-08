
export enum TASK_TYPE {
  PRE_ANALYZE = 'preAnalyze',
  RUN = 'run',
  ANALYZE = 'analyze'
}

export enum TASK_STATUS {
  START = 'start',
  READY = 'ready',
  END = 'end',
  CANCEL = 'cancel'
}

export interface Task {
  type: TASK_TYPE
  data: any
}

export interface TaskMessage {
  type: TASK_TYPE
  status: TASK_STATUS
  data?: any
}
