import { Observable, Subject, from, of } from 'rxjs';
import { mergeMap as mergeMap$1, tap, combineLatest, filter, finalize } from 'rxjs/operators';
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

let GLOBALS;

(function (GLOBALS) {
  GLOBALS["MESSAGES"] = "__EPK_MESSAGES";
  GLOBALS["SEND_MESSAGE"] = "__EPK_SEND_MESSAGE";
})(GLOBALS || (GLOBALS = {}));

globalThis[GLOBALS.MESSAGES] = new Subject();

var mergeMap = ((project, resultSelector, concurrent) => mergeMap$1((...args) => {
  var _from;

  const result = project(...args);
  return result instanceof Promise ? (_from = from(result), mergeMap$1(obs => obs)(_from)) : result;
}, resultSelector, concurrent));

var chrome = (async () => {
  var _emit;

  const puppeteer = await require('puppeteer', __filename);
  const browser = await puppeteer.launch({
    devtools: true
  });
  return _emit = emit((options, func) => {
    var _ref, _of;

    return _ref = (_of = of(func), mergeMap(async func => {
      var _func;

      const page = await browser.newPage();
      const pageMessages = new Subject();
      await page.addScriptTag({
        url: options.filePath
      });
      await page.exposeFunction(GLOBALS.SEND_MESSAGE, msg => pageMessages.next(msg));
      let count = 0;
      return _func = func(task => {
        var _ref2, _ref3, _task;

        const id = count;
        count++;
        return _ref2 = (_ref3 = (_task = task, tap(message => page.evaluate((message, GLOBALS) => globalThis[GLOBALS.MESSAGES].next(message), {
          id,
          ...message
        }, GLOBALS))(_task)), combineLatest(pageMessages, (_, task) => task)(_ref3)), filter(({
          id: _id
        }) => _id === id)(_ref2);
      }), finalize(() => page.close())(_func);
    })(_of)), mergeMap(obs => obs)(_ref);
  }), finalize(() => browser.close())(_emit);
});

let RUNTIMES;

(function (RUNTIMES) {
  RUNTIMES["CHROME"] = "chrome";
})(RUNTIMES || (RUNTIMES = {}));

const runtimeMap = new Map([[RUNTIMES.CHROME, chrome]]);

export { GLOBALS };
//# sourceMappingURL=index.js.map
