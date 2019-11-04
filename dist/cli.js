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

let GLOBALS;

(function (GLOBALS) {
  GLOBALS["MESSAGES"] = "__EPK_MESSAGES";
  GLOBALS["SEND_MESSAGE"] = "__EPK_SEND_MESSAGE";
})(GLOBALS || (GLOBALS = {}));

var chrome = (async contextObservable => {
  var _ref, _contextObservable;

  const puppeteer = await require$1('puppeteer', __filename);
  const browser = await puppeteer.launch();
  return _ref = (_contextObservable = contextObservable, operators.mergeMap(async taskObservable => {
    var _ref2, _taskObservable;

    const page = await browser.newPage();
    const pageMessages = new rxjs.Subject();
    await page.exposeFunction(GLOBALS.SEND_MESSAGE, msg => pageMessages.next(msg));
    return _ref2 = (_taskObservable = taskObservable, operators.mergeMap((task, id) => {
      var _ref3, _ref4, _task;

      return _ref3 = (_ref4 = (_task = task, operators.tap(message => page.evaluate(message => globalThis[GLOBALS.MESSAGES].next(message), {
        id,
        ...message
      }))(_task)), combineLatest(pageMessages, (_, task) => task)(_ref4)), operators.filter(({
        id: _id
      }) => _id === id)(_ref3);
    })(_taskObservable)), operators.finalize(() => page.close())(_ref2);
  })(_contextObservable)), operators.finalize(() => browser.close())(_ref); // return (
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

var emit = (value => rxjs.Observable.create(observer => observer.next(value)));

let RUNTIMES;

(function (RUNTIMES) {
  RUNTIMES["CHROME"] = "chrome";
})(RUNTIMES || (RUNTIMES = {}));

const runtimeMap = new Map([[RUNTIMES.CHROME, chrome]]);
var runtimeFactory = (options => {
  var _emit;

  const runtimes = new Map();
  return _emit = emit(async runtimeName => {
    if (!runtimes.has(runtimeName)) {
      const obs = await runtimeMap.get(runtimeName)();
      let createContext;
      const sub = obs.subscribe(_createContext => createContext = _createContext);
      runtimes.set(runtimeName, {
        subscription: sub,
        createContext
      });
    }

    return task => {
      if (!rxjs.isObservable(task)) {
        const subject = new rxjs.ReplaySubject();
        const context = runtimes.get(runtimeName).createContext(subject);
        return task => {
          task.subscribe(subject);
        };
      } else {
        return runtimes.get(runtimeName).createContext(task);
      }
    };
  }), operators.finalize(() => Array.from(runtimes.values()).forEach(({
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

  return _combineLatest = rxjs.combineLatest(Parcel(), runtimeFactory()), operators.switchMap(([bundle, runtime]) => {
    var _ref3, _ref4, _ref5, _ref6, _bundle$changedAssets;

    return _ref3 = (_ref4 = (_ref5 = (_ref6 = (_bundle$changedAssets = bundle.changedAssets.values(), Array.from(_bundle$changedAssets)), _ref6.reduce((arr, asset) => [...arr, ...getAssetSupportedTargets(asset).map(target => ({
      asset,
      target
    }))], [])), rxjs.from(_ref5)), operators.groupBy(({
      target
    }) => target, ({
      asset
    }) => asset)(_ref4) // Observable per target that emit assets
    ), operators.mergeMap(assets => {
      var _combineLatest2;

      return _combineLatest2 = rxjs.combineLatest(assets, runtime(assets.key)), operators.mergeMap(([asset, createContext]) => {
        const unisolatedContext = createContext(run => {
          var _of, _ref7, _ref8, _preAnalyze;

          const preAnalyze = (_of = rxjs.of({
            type: TASK_TYPE.PRE_ANALYZE,
            url: asset.filePath
          }), run(_of));
          const tests = (_ref7 = (_ref8 = (_preAnalyze = preAnalyze, operators.mergeMap(analyze => {
            var _ref9, _from;

            return _ref9 = (_from = rxjs.from(analyze.tests), operators.filter(({
              isolated,
              async
            }) => !isolated && !async)(_from)), operators.toArray()(_ref9);
          })(_preAnalyze)), operators.map(tests => ({
            type: TASK_TYPE.RUN,
            url: asset.filePath,
            tests
          }))(_ref8)), run(_ref7));
          return rxjs.merge(preAnalyze, tests);
        });
        return rxjs.merge(unisolatedContext);
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
