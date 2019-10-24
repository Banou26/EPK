'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var rxjs = require('rxjs');
var operators = require('rxjs/operators');
var Parcel$1 = _interopDefault(require('@parcel/core'));
var packageManager = require('@parcel/package-manager');
var fs$1 = require('@parcel/fs');

var AsyncObservable = (func => rxjs.Observable.create(observer => {
  const unsubscribe = func(observer);
  return async () => {
    var _ref;

    return (_ref = await unsubscribe) === null || _ref === void 0 ? void 0 : _ref();
  };
}));

let PARCEL_REPORTER_EVENT;

(function (PARCEL_REPORTER_EVENT) {
  PARCEL_REPORTER_EVENT["BUILD_START"] = "buildStart";
  PARCEL_REPORTER_EVENT["BUILD_PROGRESS"] = "buildProgress";
  PARCEL_REPORTER_EVENT["BUILD_SUCCESS"] = "buildSuccess";
  PARCEL_REPORTER_EVENT["BUILD_FAILURE"] = "buildFailure";
  PARCEL_REPORTER_EVENT["LOG"] = "log";
})(PARCEL_REPORTER_EVENT || (PARCEL_REPORTER_EVENT = {}));

var Parcel = (initialParcelOptions => AsyncObservable(async observer => {
  const parcel = new Parcel$1({
    entries: ['tests/unit/index_test.ts'],
    targets: {
      test: {
        distDir: '.epk/dist/browser',
        browsers: ['last 1 Chrome versions'] // ["> 1%", "not dead"]

      }
    },
    sourceMaps: true,
    minify: true,
    scopeHoist: true
  });
  const {
    unsubscribe
  } = await parcel.watch((err, build) => {
    if (err) observer.throw(err);
    observer.next(build);
  });
  return () => unsubscribe();
}));

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

const fs = new fs$1.NodeFS();
const pkgInstaller = new packageManager.Yarn();
const npm = new packageManager.NodePackageManager(fs, pkgInstaller);
var install = ((...args) => npm.install(...args));

var chrome = (async taskSubject => {
  var _taskSubject;

  const puppeteer = await install(['puppeteer'], __filename);
  return _taskSubject = taskSubject, operators.map(task => ({
    task
  }))(_taskSubject);
});

const runtimeMap = new Map([['chrome', chrome]]);
var runtimeFactory = (options => {
  var _of;

  const runtimeSubjects = new Map();
  const runtimes = new Map();
  return _of = rxjs.of(async (runtimeName, task) => {
    var _runtime;

    if (!runtimes.has(runtimeName)) {
      const subject = new rxjs.Subject();
      runtimeSubjects.set(runtimeName, subject);
      runtimes.set(runtimeName, (await runtimeMap.get(runtimeName)(subject)));
    }

    const subject = runtimeSubjects.get(runtimeName);
    const runtime = runtimes.get(runtimeName);
    Promise.resolve().then(() => subject.next(task));
    return _runtime = runtime, operators.filter(({
      task: _task
    }) => _task === task)(_runtime);
  }), operators.finalize(() => Array.from(runtimeSubjects.values()).forEach(subject => subject.complete()))(_of);
});

var EPK = (parcelOptions => {
  var _combineLatest;

  return _combineLatest = rxjs.combineLatest(Parcel(), runtimeFactory()), operators.switchMap(([bundle, run]) => {
    var _ref, _ref2, _of;

    return _ref = (_ref2 = (_of = rxjs.of(bundle), operators.mergeMap(({
      changedAssets
    }) => rxjs.from(Array.from(changedAssets.values())))(_of)), operators.map(asset => ({
      engines: ['chrome' // todo: add this back
      // ...browsersList(asset.env.engines.browsers)
      //   .map(str =>
      //     str
      //       .split(' ')
      //       .shift()
      //   )
      ],
      asset
    }))(_ref2)), operators.mergeMap(({
      engines,
      asset
    }) => {
      var _from;

      return _from = rxjs.from(engines), operators.mergeMap(runtime => run(runtime, {
        type: TASK_TYPE.PRE_ANALYZE
      }))(_from);
    })(_ref);
  })(_combineLatest);
}); // AsyncObservable(observer => {
//   const bundle =
//     (Parcel(parcelOptions)
//     |> publish())
//       .refCount()
//   const analyze =
//     bundle
//     |> switchMap(bundle =>
//       of(bundle)
//       |> mergeMap(({ changedAssets }) => from(changedAssets.values()))
//       |> map(asset => ({ asset }))
//       |> mergeMap(asset =>
//         of(asset)
//         |> )
//       |> groupBy(({ env: { context, engines: { browsers } } }) =>
//         context === 'browser'
//           ? ['chrome']
//           // ? browsersList(browsers)
//           //   .map(str => str.split(' '))
//           //   .shift()
//           : ['node']
//       )
//       |> mergeMap(group =>
//         zip(
//           of(group.key),
//           group
//         )
//       )
//       |> mergeMap(([contexts, asset]) =>
//         from(contexts)
//         |> map(context => [context, asset])
//       )
//       |> mergeMap(([context, asset]) => {
//         debugger
//       })
//     )
//   const analyzeSubscription = analyze.subscribe()
//   return () => {
//     analyzeSubscription.unsubscribe()
//   }
// })

// import Parcel from '@parcel/core'

const run = entryFiles => {
  const epk = EPK();
  epk.subscribe(v => console.log(v));
};

run();
//# sourceMappingURL=cli.js.map
