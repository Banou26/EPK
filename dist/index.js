import { Subject } from 'rxjs';
import { mergeMap, tap, filter, finalize } from 'rxjs/operators';
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

let GLOBALS;

(function (GLOBALS) {
  GLOBALS["MESSAGES"] = "__EPK_MESSAGES";
  GLOBALS["SEND_MESSAGE"] = "__EPK_SEND_MESSAGE";
})(GLOBALS || (GLOBALS = {}));

var chrome = (async contextObservable => {
  var _ref, _contextObservable;

  const puppeteer = await require('puppeteer', __filename);
  const browser = await puppeteer.launch();
  return _ref = (_contextObservable = contextObservable, mergeMap(async taskObservable => {
    var _ref2, _taskObservable;

    const page = await browser.newPage();
    const pageMessages = new Subject();
    await page.exposeFunction(GLOBALS.SEND_MESSAGE, msg => pageMessages.next(msg));
    return _ref2 = (_taskObservable = taskObservable, mergeMap((task, id) => {
      var _ref3, _ref4, _task;

      return _ref3 = (_ref4 = (_task = task, tap(message => page.evaluate(message => globalThis[GLOBALS.MESSAGES].next(message), {
        id,
        ...message
      }))(_task)), combineLatest(pageMessages, (_, task) => task)(_ref4)), filter(({
        id: _id
      }) => _id === id)(_ref3);
    })(_taskObservable)), finalize(() => page.close())(_ref2);
  })(_contextObservable)), finalize(() => browser.close())(_ref); // return (
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

export { GLOBALS };
//# sourceMappingURL=index.js.map
