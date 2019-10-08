import { Worker, isMainThread, parentPort, workerData } from 'worker_threads'
import { TASK_STATUS } from '../core/task.ts'

parentPort.on('message', (message) => {
  console.log('received', message)
  if (message.status === TASK_STATUS.START) parentPort.postMessage({ status: TASK_STATUS.READY })
  setTimeout(() => parentPort.postMessage({ status: TASK_STATUS.END }), 1000)
})
// setTimeout(() => parentPort.postMessage({ status: TASK_STATUS.END }), 1000)
