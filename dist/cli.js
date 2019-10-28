'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var rxjs = require('rxjs');
var operators = require('rxjs/operators');
var browsersList = _interopDefault(require('browserslist'));
var Parcel$1 = _interopDefault(require('@parcel/core'));
var packageManager$1 = require('@parcel/package-manager');
var fs = require('@parcel/fs');

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

// const pkgInstaller = new Yarn()
// const npm = new NodePackageManager(fs, pkgInstaller)
// export default (...args) => npm.install(...args)

const packageManager = new packageManager$1.NodePackageManager(new fs.NodeFS());
const require$1 = (...args) => packageManager.require(...args);

var emit = (value => rxjs.Observable.create(observer => observer.next(value)));

var chrome = (async () => {
  var _emit;

  const puppeteer = await require$1('puppeteer', __filename);
  const browser = await puppeteer.launch();
  return _emit = emit(async task => {
    const page = browser.newPage();
    return emit({
      runTask: () => {}
    });
  }), operators.finalize(() => browser.close())(_emit); // return (
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
var runtimeFactory = (options => {
  var _emit;

  const runtimes = new Map();
  return _emit = emit(async (runtimeName, task) => {
    if (!runtimes.has(runtimeName)) {
      const obs = await runtimeMap.get(runtimeName)();
      let runTask;
      const sub = obs.subscribe(_runTask => runTask = _runTask);
      runtimes.set(runtimeName, {
        subscription: sub,
        runTask
      });
    }

    return runtimes.get(runtimeName).runTask(task); // return task => {
    //   subject.next(task)
    //   return (
    //     runtime
    //     |> filter(({ task: _task }) => _task === task)
    //   )
    // }
  }), operators.finalize(() => Array.from(runtimeSubjects.values()).forEach(({
    subscription
  }) => subscription.unsubscribe()))(_emit);
});

const getAssetSupportedTargets = asset => {
  var _ref, _ref2, _browsersList;

  return [...(_ref = (_ref2 = (_browsersList = browsersList(asset.env.engines.browsers), _browsersList.map(str => str.split(' ').shift())), new Set(_ref2)), Array.from(_ref).filter(runtime => runtime.toUpperCase() in RUNTIMES)) // todo: add node/electron runtime detection
  ];
};

var EPK = (parcelOptions => {
  var _combineLatest;

  return _combineLatest = rxjs.combineLatest(Parcel(), runtimeFactory()), operators.mergeMap(([bundle, runtime]) => {
    var _ref3, _ref4, _ref5, _ref6, _bundle$changedAssets;

    return _ref3 = (_ref4 = (_ref5 = (_ref6 = (_bundle$changedAssets = bundle.changedAssets.values(), Array.from(_bundle$changedAssets)), _ref6.reduce((arr, asset) => [...arr, ...getAssetSupportedTargets(asset).map(target => ({
      asset,
      target
    }))], [])), rxjs.from(_ref5)), operators.groupBy(({
      target
    }) => target, ({
      asset
    }) => asset)(_ref4)), operators.mergeMap(assets => {
      var _combineLatest2;

      return _combineLatest2 = rxjs.combineLatest(assets, runtime(assets.key)), operators.mergeMap(([asset, run]) => {
        const preAnalyze = run({
          type: TASK_TYPE.PRE_ANALYZE
        });
      })(_combineLatest2);
    })(_ref3);
  })(_combineLatest);
}); // |> switchMap(([bundle, run]) =>
//   of(bundle)
//   |> mergeMap(({ changedAssets }) =>
//     changedAssets.values()
//     |> Array.from
//     |> from
//   )
//   |> map(asset => ({
//       engines: getAssetSupportedTargets(asset),
//       asset
//     })
//   )
//   |> mergeMap(({engines, asset}) =>
//     from(engines)
//     |> mergeMap(runtime => {
//       const analyze = run(runtime, { type: TASK_TYPE.PRE_ANALYZE })
//       return analyze
//     })
//   )
// )
// AsyncObservable(observer => {
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
