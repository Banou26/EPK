'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var rxjs = require('rxjs');
var operators = require('rxjs/operators');
var _Parcel = _interopDefault(require('@parcel/core'));
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

const {
  default: Parcel
} = _Parcel;
let PARCEL_REPORTER_EVENT;

(function (PARCEL_REPORTER_EVENT) {
  PARCEL_REPORTER_EVENT["BUILD_START"] = "buildStart";
  PARCEL_REPORTER_EVENT["BUILD_PROGRESS"] = "buildProgress";
  PARCEL_REPORTER_EVENT["BUILD_SUCCESS"] = "buildSuccess";
  PARCEL_REPORTER_EVENT["BUILD_FAILURE"] = "buildFailure";
  PARCEL_REPORTER_EVENT["LOG"] = "log";
})(PARCEL_REPORTER_EVENT || (PARCEL_REPORTER_EVENT = {}));

var Parcel$1 = (initialParcelOptions => AsyncObservable(async observer => {
  // const parcel = new Parcel(initialParcelOptions)
  const parcel = new Parcel({
    entries: ['tests/test.ts', 'tests/test2.ts'],
    targets: {
      test: {
        distDir: 'dist/browser',
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
    debugger;
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
    var _ref, _ref2, _ref3, _ref4, _task;

    const worker = idleWorker.splice(0, 1);
    const workerMessages = rxjs.fromEvent(worker, 'message');
    worker.postMessage({
      status: TASK_STATUS.START
    });
    return _ref = (_ref2 = (_ref3 = (_ref4 = (_task = task, operators.finalize(() => worker.postMessage({
      status: TASK_STATUS.CANCEL
    }))(_task) // clean up the worker
    ), operators.tap(message => worker.postMessage(message))(_ref4)), withLatestFrom(workerMessages)(_ref3) // switch the flow from having sent messages to receiving them
    ), operators.pluck(1)(_ref2) // from here we only have messages from the worker
    ), operators.map(message => [count, message])(_ref);
  }, amount)(_taskSubject));
  let taskCounter = 0;
  return messageObservable => {
    var _ref5, _queue;

    const count = taskCounter;
    taskCounter++;
    return _ref5 = (_queue = queue, operators.filter(([_count]) => count === _count)(_queue)), operators.pluck(1)(_ref5);
  };
});

var EPK = (parcelOptions => {
  var _Parcel, _parcelBundle, _build, _build2, _parcelBundle3, _bundle;

  const workerFarm = WorkerFarm();
  const parcelBundle = (_Parcel = Parcel$1(), operators.publish()(_Parcel)).refCount();
  const build = (_parcelBundle = parcelBundle, operators.filter(({
    name
  }) => name === 'buildStart')(_parcelBundle));
  const buildStart = (_build = build, operators.mapTo({
    type: PARCEL_REPORTER_EVENT.BUILD_START
  })(_build));
  const bundle = (_build2 = build, operators.switchMap(({
    entryFiles,
    buildStartTime
  }) => {
    var _ref, _parcelBundle2;

    return _ref = (_parcelBundle2 = parcelBundle, operators.filter(({
      name
    }) => name === 'bundled')(_parcelBundle2)), operators.map(bundle => ({ ...bundle,
      entryFiles,
      buildStartTime
    }))(_ref);
  })(_build2));
  const buildSuccess = (_parcelBundle3 = parcelBundle, operators.mapTo({
    type: PARCEL_REPORTER_EVENT.BUILD_SUCCESS
  })(_parcelBundle3));
  const test = (_bundle = bundle, operators.switchMap(bundle => {
    var _ref2, _of;

    return _ref2 = (_of = rxjs.of({
      type: TASK_TYPE.ANALYZE
    }), workerFarm(_of)), operators.takeUntil(({
      status
    }) => status === TASK_STATUS.END)(_ref2);
  })(_bundle));
  return test;
});

// import 'v8-compile-cache'
// import pkg from '../../package.json'
// console.log('.')
// process.on('unhandledRejection', error => {
//   console.error(error)
//   process.exit(1)
// })
// program.version(pkg.version)
// const run = (entries: Array<string>, command: any) => {
//   console.log('kkkk', entries, command)
// }
// const watch = program
//   .command('watch [input...]')
//   .description('starts the tester in watch mode')
//   .action(run)
// console.log(process.argv)
// Make watch the default command except for --help
// let args = process.argv
// if (args[2] === '--help' || args[2] === '-h') args[2] = 'help'
// if (!args[2] || !program.commands.some(c => c.name() === args[2])) {
//   args.splice(2, 0, 'watch')
// }
// console.log(process.argv)
// program.parse(process.argv)
// console.log('foo')

const run = entryFiles => {
  const epk = EPK();
  epk.subscribe(v => console.log(v));
};

run(); // console.log('foo')
