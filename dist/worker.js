'use strict';

var worker_threads = require('worker_threads');
var rxjs = require('rxjs');
var operators = require('rxjs/operators');

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

var analyze = (task => {
  var _ref, _task;

  return _ref = (_task = task, operators.first()(_task)), operators.switchMap(v => rxjs.Observable.create(observer => {
    return () => {};
  }))(_ref);
});

var preAnalyze = (task => {
  var _task;

  return _task = task, operators.tap(v => console.log(v))(_task);
});

var run = (task => {
  var _task;

  return _task = task, operators.tap(v => console.log(v))(_task);
});

const taskMap = new Map([[TASK_TYPE.ANALYZE, analyze], [TASK_TYPE.PRE_ANALYZE, preAnalyze], [TASK_TYPE.RUN, run]]);

const runTask = messages => {
  var _messages, _ref, _ref2, _replay;

  const replay = (_messages = messages, operators.shareReplay()(_messages));
  return _ref = (_ref2 = (_replay = replay, operators.first()(_replay)), operators.switchMap(({
    id,
    type
  }) => {
    var _taskMap$get;

    return _taskMap$get = taskMap.get(type)(replay), operators.finalize(() => worker_threads.parentPort.postMessage({
      id,
      status: TASK_STATUS.END
    }))(_taskMap$get);
  })(_ref2)), operators.tap(message => worker_threads.parentPort.postMessage(message))(_ref);
};

if (worker_threads.parentPort) {
  var _ref3, _fromEvent;

  const tasks = (_ref3 = (_fromEvent = rxjs.fromEvent(worker_threads.parentPort, 'message'), operators.groupBy(({
    id
  }) => id)(_fromEvent)), operators.mergeMap(runTask)(_ref3));
  tasks.subscribe();
}

module.exports = runTask;
//# sourceMappingURL=worker.js.map
