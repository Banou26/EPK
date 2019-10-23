import 'rxjs';
import 'rxjs/operators';
import 'browserslist';
import '@parcel/core';

let PARCEL_REPORTER_EVENT;

(function (PARCEL_REPORTER_EVENT) {
  PARCEL_REPORTER_EVENT["BUILD_START"] = "buildStart";
  PARCEL_REPORTER_EVENT["BUILD_PROGRESS"] = "buildProgress";
  PARCEL_REPORTER_EVENT["BUILD_SUCCESS"] = "buildSuccess";
  PARCEL_REPORTER_EVENT["BUILD_FAILURE"] = "buildFailure";
  PARCEL_REPORTER_EVENT["LOG"] = "log";
})(PARCEL_REPORTER_EVENT || (PARCEL_REPORTER_EVENT = {}));

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
//# sourceMappingURL=index.js.map
