'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var rxjs = require('rxjs');
var operators = require('rxjs/operators');
var Parcel$1 = _interopDefault(require('@parcel/core'));
var os = _interopDefault(require('os'));
var childProcess = _interopDefault(require('child_process'));
var worker_threads = require('worker_threads');

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
        "browsers": ["> 1%", "not dead"]
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

let amount;

if (globalThis.window !== undefined) {
  amount = window.navigator.hardwareConcurrency;
} else {
  const exec = command => childProcess.execSync(command, {
    encoding: 'utf8'
  });

  const platform = os.platform();

  if (platform === 'linux') {
    const output = exec('lscpu -p | egrep -v "^#" | sort -u -t, -k 2,4 | wc -l');
    amount = parseInt(output.trim(), 10);
  } else if (platform === 'darwin') {
    const output = exec('sysctl -n hw.physicalcpu_max');
    amount = parseInt(output.trim(), 10);
  } else if (platform === 'windows') {
    const output = exec('WMIC CPU Get NumberOfCores');
    amount = output.split(os.EOL).map(line => parseInt(line)).filter(value => !isNaN(value)).reduce((sum, number) => sum + number, 0);
  } else {
    const cores = os.cpus().filter(function (cpu, index) {
      const hasHyperthreading = cpu.model.includes('Intel');
      const isOdd = index % 2 === 1;
      return !hasHyperthreading || isOdd;
    });
    amount = cores.length;
  }
}

let TASK_TYPE;

(function (TASK_TYPE) {
  TASK_TYPE["PRE_ANALYZE"] = "preAnalyze";
  TASK_TYPE["RUN"] = "run";
  TASK_TYPE["ANALYZE"] = "analyze";
})(TASK_TYPE || (TASK_TYPE = {}));

let TASK_STATUS;

(function (TASK_STATUS) {
  TASK_STATUS["START"] = "start";
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

var WorkerFarm = (() => {
  var _taskSubject;

  const idleWorker = Array(amount).fill(undefined).map(() => new worker_threads.Worker('./dist/worker.js'));
  const taskSubject = new rxjs.Subject();
  const queue = (_taskSubject = taskSubject, operators.mergeMap((task, _, count) => {
    var _ref, _ref2, _ref3, _ref4, _ref5, _task;

    const worker = idleWorker.splice(0, 1);
    const workerMessages = rxjs.fromEvent(worker, 'message');
    worker.postMessage({
      status: TASK_STATUS.START
    });
    return _ref = (_ref2 = (_ref3 = (_ref4 = (_ref5 = (_task = task, operators.finalize(() => {
      idleWorker.push(worker);
      worker.postMessage({
        status: TASK_STATUS.CANCEL
      });
    })(_task) // clean up the worker
    ), takeUntil(({
      status
    }) => status === TASK_STATUS.END)(_ref5)), operators.tap(message => worker.postMessage(message))(_ref4)), withLatestFrom(workerMessages)(_ref3) // switch the flow from having sent messages to receiving them
    ), operators.pluck(1)(_ref2) // from here we only have messages from the worker
    ), operators.map(message => [count, message])(_ref);
  }, amount)(_taskSubject));
  let taskCounter = 0;
  return messageObservable => {
    var _ref6, _queue;

    const count = taskCounter;
    taskCounter++;
    return _ref6 = (_queue = queue, operators.filter(([_count]) => count === _count)(_queue)), operators.pluck(1)(_ref6);
  };
});

var EPK = (parcelOptions => {
  var _Parcel, _parcelBundle, _build, _bundle;

  const workerFarm = WorkerFarm();
  const parcelBundle = (_Parcel = Parcel(), operators.publish()(_Parcel)).refCount();
  const build = (_parcelBundle = parcelBundle, operators.filter(({
    name
  }) => name === PARCEL_REPORTER_EVENT.BUILD_START)(_parcelBundle));
  const bundle = (_build = build, operators.switchMap(({
    entryFiles,
    buildStartTime
  }) => {
    var _ref, _parcelBundle2;

    return _ref = (_parcelBundle2 = parcelBundle, operators.filter(({
      name
    }) => name === PARCEL_REPORTER_EVENT.BUILD_SUCCESS)(_parcelBundle2)), operators.map(bundle => ({ ...bundle,
      entryFiles,
      buildStartTime
    }))(_ref);
  })(_build));
  const test = (_bundle = bundle, operators.switchMap(bundle => {
    var _of;

    return _of = rxjs.of({
      type: TASK_TYPE.ANALYZE
    }), workerFarm(_of);
  })(_bundle));
  return test;
});

// import Parcel from '@parcel/core'

const run = entryFiles => {
  const epk = EPK();
  epk.subscribe(v => console.log(v));
};

run();
