'use strict';

var worker_threads = require('worker_threads');

let TASK_TYPE;

(function (TASK_TYPE) {
  TASK_TYPE["PRE_ANALYZE"] = "preAnalyze";
  TASK_TYPE["RUN"] = "run";
  TASK_TYPE["ANALYZE"] = "analyze";
})(TASK_TYPE || (TASK_TYPE = {}));

let TASK_STATUS;

(function (TASK_STATUS) {
  TASK_STATUS["START"] = "start";
  TASK_STATUS["READY"] = "ready";
  TASK_STATUS["END"] = "end";
  TASK_STATUS["CANCEL"] = "cancel";
})(TASK_STATUS || (TASK_STATUS = {})); // export default
//   (task: Task) =>
//     messages =>
//       messages
//       |> 
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

worker_threads.parentPort.on('message', message => {
  console.log('received', message);
  if (message.status === TASK_STATUS.START) worker_threads.parentPort.postMessage({
    status: TASK_STATUS.READY
  });
  setTimeout(() => worker_threads.parentPort.postMessage({
    status: TASK_STATUS.END
  }), 1000);
}); // setTimeout(() => parentPort.postMessage({ status: TASK_STATUS.END }), 1000)
//# sourceMappingURL=worker.js.map
