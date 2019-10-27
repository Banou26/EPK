import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import 'browserslist';
import '@parcel/core';
import { NodePackageManager } from '@parcel/package-manager';
import { NodeFS } from '@parcel/fs';

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

// const pkgInstaller = new Yarn()
// const npm = new NodePackageManager(fs, pkgInstaller)
// export default (...args) => npm.install(...args)

const packageManager = new NodePackageManager(new NodeFS());
const require = (...args) => packageManager.require(...args);

var emit = (value => Observable.create(observer => observer.next(value)));

var chrome = (async () => {
  var _emit;

  const puppeteer = await require('puppeteer', __filename);
  const browser = await puppeteer.launch();
  return _emit = emit(async task => {
    const page = browser.newPage();
    return emit({
      runTask: () => {}
    });
  }), finalize(() => browser.close())(_emit); // return (
  //   taskSubject
  //   |> mergeMap(async task => {
  //     return {
  //       task,
  //       page: await browser.newPage()
  //     }
  //   })
  //   |> finalize(async () => {
  //     await browser.close()
  //   })z
  // )
});

let RUNTIMES;

(function (RUNTIMES) {
  RUNTIMES["CHROME"] = "chrome";
})(RUNTIMES || (RUNTIMES = {}));

const runtimeMap = new Map([[RUNTIMES.CHROME, chrome]]);
//# sourceMappingURL=index.js.map
