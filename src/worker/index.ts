import { parentPort } from 'worker_threads'
import { TASK_STATUS } from '../core/task.ts'
import { fromEvent } from 'rxjs'
import { tap } from 'rxjs/operators'

const tasks =
  fromEvent(parentPort, 'message')

tasks.subscribe(task => console.log(task))