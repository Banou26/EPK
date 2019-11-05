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

let GLOBALS;

(function (GLOBALS) {
  GLOBALS["MESSAGES"] = "__EPK_MESSAGES";
  GLOBALS["SEND_MESSAGE"] = "__EPK_SEND_MESSAGE";
})(GLOBALS || (GLOBALS = {}));

globalThis[GLOBALS.MESSAGES] = new rxjs.Subject();

var mergeMap = ((project, resultSelector, concurrent) => operators.mergeMap((...args) => {
  var _from;

  const result = project(...args);
  return result instanceof Promise ? (_from = rxjs.from(result), operators.mergeMap(obs => obs)(_from)) : result;
}, resultSelector, concurrent));

var chrome = (async () => {
  var _emit;

  const puppeteer = await require$1('puppeteer', __filename);
  const browser = await puppeteer.launch();
  return _emit = emit(func => {
    var _ref, _of;

    return _ref = (_of = rxjs.of(func), mergeMap(async func => {
      var _func;

      const page = await browser.newPage();
      const pageMessages = new rxjs.Subject();
      await page.exposeFunction(GLOBALS.SEND_MESSAGE, msg => pageMessages.next(msg));
      let count = 0;
      return _func = func(task => {
        var _ref2, _ref3, _task;

        const id = count;
        count++;
        return _ref2 = (_ref3 = (_task = task, operators.tap(message => page.evaluate((message, GLOBALS) => globalThis[GLOBALS.MESSAGES].next(message), {
          id,
          ...message
        }, GLOBALS))(_task)), operators.combineLatest(pageMessages, (_, task) => task)(_ref3)), operators.filter(({
          id: _id
        }) => _id === id)(_ref2);
      }), operators.finalize(() => page.close())(_func);
    })(_of)), mergeMap(obs => obs)(_ref);
  }), operators.finalize(() => browser.close())(_emit);
});

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

    return runtimes.get(runtimeName).createContext;
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
      target,
      bundle
    }))], [])), rxjs.from(_ref5)), operators.groupBy(({
      target
    }) => target, ({
      bundle,
      asset
    }) => ({
      bundle,
      asset
    }))(_ref4) // Observable per target that emit assets
    ), operators.mergeMap(assets => {
      var _combineLatest2, _runtime;

      return _combineLatest2 = rxjs.combineLatest(assets, (_runtime = runtime(assets.key), rxjs.from(_runtime))), operators.mergeMap(([{
        bundle,
        asset
      }, createContext]) => {
        const unisolatedContext = createContext({
          url: asset.filePath
        }, run => {
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
});

// import Parcel from '@parcel/core'

const run = entryFiles => {
  const epk = EPK();
  epk.subscribe(v => console.log(v));
};

run();
//# sourceMappingURL=cli.js.map
