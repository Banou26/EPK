import { Observable } from 'rxjs'

export enum TASK_TYPE {
  PRE_ANALYZE = 'preAnalyze',
  RUN = 'run',
  ANALYZE = 'analyze'
}

export enum TASK_STATUS {
  START = 'start',
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
  data: any
}

export default
  (task: Task) =>
    messages =>
      messages
      |> 


// export default (task: Task) =>
//   Observable.create(observer => {
//     let _observer
//     const task = Observable.create<TaskMessage>(observer => {
//       _observer = observer
//       observer.next({ type: TASK_STATUS.START })
//       return () => observer.next({ type: TASK_STATUS.CANCEL })
//     })
//     workerFarm.next(task)
//     return () => _observer.complete()
//   })
