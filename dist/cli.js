'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var rxjs = require('rxjs');
var operators = require('rxjs/operators');
var Parcel$1 = _interopDefault(require('@parcel/core'));

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

var EPK = (parcelOptions => AsyncObservable(observer => {
  var _Parcel, _bundle;

  const bundle = (_Parcel = Parcel(), operators.publish()(_Parcel)).refCount();
  const analyze = (_bundle = bundle, operators.switchMap(bundle => {
    var _ref, _ref2, _ref3, _ref4, _of;

    return _ref = (_ref2 = (_ref3 = (_ref4 = (_of = rxjs.of(bundle), operators.mergeMap(({
      changedAssets
    }) => rxjs.from(changedAssets.values()))(_of)), operators.groupBy(({
      env: {
        context,
        engines: {
          browsers
        }
      }
    }) => context === 'browser' ? ['chrome'] // ? browsersList(browsers)
    //   .map(str => str.split(' '))
    //   .shift()
    : ['node'])(_ref4)), operators.mergeMap(group => rxjs.zip(rxjs.of(group.key), group))(_ref3)), operators.mergeMap(([contexts, asset]) => {
      var _from;

      return _from = rxjs.from(contexts), operators.map(context => [context, asset])(_from);
    })(_ref2)), operators.mergeMap(([context, asset]) => {
      debugger;
    })(_ref);
  })(_bundle));
  const analyzeSubscription = analyze.subscribe();
  return () => {
    analyzeSubscription.unsubscribe();
  };
}));

// import Parcel from '@parcel/core'

const run = entryFiles => {
  const epk = EPK();
  epk.subscribe(v => console.log(v));
};

run();
//# sourceMappingURL=cli.js.map
