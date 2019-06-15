'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var path = _interopDefault(require('path'));
require('v8-compile-cache');
var getPort = _interopDefault(require('get-port'));
var program = _interopDefault(require('commander'));
var chalk = _interopDefault(require('chalk'));
var rxjs = require('rxjs');
var operators = require('rxjs/operators');
require('core-js/features/set');
var ParcelBundler = _interopDefault(require('parcel-bundler'));
var fs = _interopDefault(require('fs'));
var util = require('util');
var child_process = require('child_process');
var module$1 = require('module');
var flatted = require('flatted');
var perf_hooks = require('perf_hooks');
var ink = require('ink');
var React = require('react');
var React__default = _interopDefault(React);
var BorderBox = _interopDefault(require('ink-box'));

var name = "epk";
var version = "0.3.0";
var license = "MIT";
var type = "module";
var main = "lib/index.js";
var browser = "lib/browser.js";
var bin = {
	epk: "bin/cli.js"
};
var engines = {
	node: ">= 11.0.0"
};
var browserslist = [
	"last 1 Chrome versions"
];
var devDependencies = {
	"@babel/cli": "^7.4.4",
	"@babel/core": "^7.4.4",
	"@babel/plugin-proposal-optional-chaining": "^7.2.0",
	"@babel/plugin-proposal-pipeline-operator": "^7.3.2",
	"@babel/plugin-proposal-throw-expressions": "^7.2.0",
	"@babel/plugin-syntax-dynamic-import": "^7.2.0",
	"@babel/preset-typescript": "^7.3.3",
	"@types/node": "^12.0.0",
	"@types/parcel-bundler": "^1.12.0",
	"@types/puppeteer": "^1.12.4",
	"core-js": "^3.0.1",
	nodemon: "^1.19.0",
	rollup: "^1.11.3",
	"rollup-plugin-babel": "^4.3.2"
};
var scripts = {
	"build-browser": "rollup -m -w -c rollup.browser.config.js",
	"build-cli": "rollup -m -c rollup.cli.config.js -w",
	"build-babel": "babel src -w -s -d lib -ex \".ts,.tsx\"",
	test: "node --experimental-modules tests/e2e/installImport.js"
};
var dependencies = {
	"@babel/plugin-transform-modules-commonjs": "^7.4.4",
	"@babel/plugin-transform-react-jsx": "^7.3.0",
	"@babel/preset-react": "^7.0.0",
	"babel-plugin-espower": "^3.0.1",
	chalk: "^2.4.2",
	"cli-spinners": "^2.1.0",
	commander: "^2.20.0",
	flatted: "^2.0.0",
	"get-port": "^5.0.0",
	ink: "^2.1.1",
	"ink-box": "^1.0.0",
	koa: "^2.7.0",
	"koa-mount": "^4.0.0",
	"koa-static": "^5.0.0",
	"parcel-bundler": "^1.12.3",
	"power-assert": "^1.6.1",
	puppeteer: "^1.15.0",
	react: "^16.8.6",
	"rollup-plugin-json": "^4.0.0",
	rxjs: "^6.5.1",
	"stacktrace-parser": "^0.1.6",
	"v8-compile-cache": "^2.0.3"
};
var pkg = {
	name: name,
	version: version,
	license: license,
	type: type,
	main: main,
	browser: browser,
	bin: bin,
	engines: engines,
	browserslist: browserslist,
	devDependencies: devDependencies,
	scripts: scripts,
	dependencies: dependencies
};

var Parcel = ((options = undefined) => rxjs.Observable.create(observer => {
  const bundler = new ParcelBundler(options.entryFiles, options);
  bundler.addAssetType('js', path.resolve(__dirname, '../src/core/parcel/js-asset.js'));
  bundler.addAssetType('ts', path.resolve(__dirname, '../src/core/parcel/ts-asset.js'));
  bundler.on('bundled', bundle => observer.next({
    name: 'bundled',
    parcelBundle: bundle,
    buildEndTime: Date.now()
  }));
  bundler.on('buildStart', entryFiles => observer.next({
    name: 'buildStart',
    entryFiles,
    buildStartTime: Date.now()
  }));
  bundler.on('buildEnd', () => observer.next({
    name: 'buildEnd'
  }));

  const emitError = err => observer.error(err);

  bundler.on('buildError', emitError);
  bundler.bundle().catch(emitError);
  return () => bundler.stop().catch(emitError);
}));

// Subject that is sent data from the tester to the runtime
const EPK_SUBJECT = '__EPK__SUBJECT__'; // Subject that is sent data from the runtime to the tester

const EPK_RUNTIME_SUBJECT = '__EPK__RUNTIME__SUBJECT__';
const EPK_FUNCTION_PROPERTY_PLACEHOLDER = '__EPK__FUNCTION__PLACEHOLDER__';
let MESSAGE;

(function (MESSAGE) {
  MESSAGE[MESSAGE["GET_TESTS"] = 0] = "GET_TESTS";
  MESSAGE[MESSAGE["GET_TESTS_RESPONSE"] = 1] = "GET_TESTS_RESPONSE";
  MESSAGE[MESSAGE["RUN_TESTS"] = 2] = "RUN_TESTS";
  MESSAGE[MESSAGE["RUN_TESTS_RESPONSE"] = 3] = "RUN_TESTS_RESPONSE";
  MESSAGE[MESSAGE["RUN_TEST"] = 4] = "RUN_TEST";
  MESSAGE[MESSAGE["RUN_TEST_RESPONSE"] = 5] = "RUN_TEST_RESPONSE";
})(MESSAGE || (MESSAGE = {}));

const messageMap = new Map([[MESSAGE.GET_TESTS, MESSAGE.GET_TESTS_RESPONSE], [MESSAGE.RUN_TESTS, MESSAGE.RUN_TESTS_RESPONSE], [MESSAGE.RUN_TEST, MESSAGE.RUN_TEST_RESPONSE]]);

let PARCEL_REPORTER_EVENT;

(function (PARCEL_REPORTER_EVENT) {
  PARCEL_REPORTER_EVENT["BUILD_START"] = "buildStart";
  PARCEL_REPORTER_EVENT["BUILD_PROGRESS"] = "buildProgress";
  PARCEL_REPORTER_EVENT["BUILD_SUCCESS"] = "buildSuccess";
  PARCEL_REPORTER_EVENT["BUILD_FAILURE"] = "buildFailure";
  PARCEL_REPORTER_EVENT["LOG"] = "log";
})(PARCEL_REPORTER_EVENT || (PARCEL_REPORTER_EVENT = {}));

let REPORTER_EVENT;

(function (REPORTER_EVENT) {
  REPORTER_EVENT["BUILD_START"] = "buildStart";
  REPORTER_EVENT["BUILD_PROGRESS"] = "buildProgress";
  REPORTER_EVENT["BUILD_SUCCESS"] = "buildSuccess";
  REPORTER_EVENT["BUILD_FAILURE"] = "buildFailure";
  REPORTER_EVENT["LOG"] = "log";
  REPORTER_EVENT["PORT_SEARCH"] = "portSearch";
  REPORTER_EVENT["PORT_FOUND"] = "portFound";
  REPORTER_EVENT["WEB_SERVER_START"] = "webServerStart";
  REPORTER_EVENT["WEB_SERVER_READY"] = "webServerReady";
  REPORTER_EVENT["STATE"] = "state";
})(REPORTER_EVENT || (REPORTER_EVENT = {}));

let TARGET;

(function (TARGET) {
  TARGET["BROWSER"] = "browser";
  TARGET["NODE"] = "node";
})(TARGET || (TARGET = {}));

let BROWSER;

(function (BROWSER) {
  BROWSER["FIREFOX"] = "firefox";
  BROWSER["FIREFOX_NIGHTLY"] = "firefoxNightly";
  BROWSER["CHROME"] = "chrome";
  BROWSER["CHROME_CANARY"] = "chromeCanary";
})(BROWSER || (BROWSER = {}));

let RUNTIME;

(function (RUNTIME) {
  RUNTIME["FIREFOX"] = "firefox";
  RUNTIME["FIREFOX_NIGHTLY"] = "firefoxNightly";
  RUNTIME["CHROME"] = "chrome";
  RUNTIME["CHROME_CANARY"] = "chromeCanary";
  RUNTIME["NODE"] = "node";
})(RUNTIME || (RUNTIME = {}));

let LOG;

(function (LOG) {
  LOG["log"] = "log";
  LOG["info"] = "info";
  LOG["warn"] = "warn";
  LOG["error"] = "error";
  LOG["uncaughtError"] = "uncaughtError";
})(LOG || (LOG = {}));

const _access = util.promisify(fs.access);

const cwd = process.cwd();
const access = (filename, _path = '') => _access(path.resolve(_path, filename), fs.constants.F_OK).then(() => true, () => false);
const prettifyPath = _path => path.relative(cwd, _path);
const pathToTestUrl = (_path, {
  outDir = '.epk',
  port = undefined
}) => `${port ? `http://localhost:${port}` : ''}${path.normalize(_path).replace(`${path.resolve(cwd, outDir, 'dist')}${path.sep}`, '/tests/').replace(path.sep, '/')}`;
const pathToEpkUrl = (_path, {
  port
}) => `${port ? `http://localhost:${port}` : ''}${path.normalize(_path).replace(`${path.resolve(__dirname, '..', 'lib')}${path.sep}`, '/epk/').replace(path.sep, '/')}`;

// const { Observable, Subject, from } = rxjs
// const { shareReplay, filter, bufferTime, mergeMap, skip } = rxjsOperators
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const getClosestPackageJSONDirPath = (_path = undefined, _cwd = cwd) => access('package.json', _path || _cwd).then(access => {
  if (access) return _path || _cwd;
  const parentPath = path.resolve('..', _path);
  return parentPath === _cwd ? undefined : getClosestPackageJSONDirPath(parentPath);
});
/**
 * 
 * @param path Package.json path
 * @returns Promise of a dependency and devDependency Set tuple
 */

const getDependencies = path => readFile(path, 'utf8').then(data => data, err => // If package.json doesn't exist, create an empty one
err.code === 'ENOENT' && writeFile(path, '{}').then(() => '{}')).then(data => JSON.parse(data)).then(({
  dependencies,
  devDependencies
}) => [new Set([...module$1.builtinModules, ...Object.keys(dependencies)]), new Set([...module$1.builtinModules, ...Object.keys(devDependencies)])]); // const installPackages = (dependencies: string[], { path, dev, yarn }: { path: string, dev: boolean, yarn: boolean }) =>
// 	Observable.create(observer => {
// 		const child = spawn(
// 			yarn ? 'yarn' : 'npm',
// 			[
// 				yarn ? 'add' : 'install',
// 				...dependencies.map(name =>
// 						name
// 							.split('/')
// 							.shift()),
// 				...dev && [yarn ? '-D': '--save-dev']
// 			],
// 			{
// 				cwd: path,
// 				stdio: 'inherit', // needed to get the colors and stream writes
// 				shell: process.platform === 'win32' // needed for windows
// 			})
// 		// If stdio is inherit, comment the data listeners
// 		// child.stdout.on('data', data => observer.next(data.toString('utf8')))
// 		// child.stderr.on('data', data => observer.error(data.toString('utf8')))
// 		child.on('close', () => observer.complete())
// 		return () => child.kill()
// 	})
// console.log(spawn('yarn -v'))

const installPackages = (dependencies, {
  path,
  dev,
  yarn
}) => new Promise(resolve => {
  const child = child_process.spawn(yarn ? 'yarn' : 'npm', [yarn ? 'add' : 'install', ...dependencies.map(name => name.split('/').shift()), ...(dev ? [yarn ? '-D' : '--save-dev'] : [])], {
    cwd: path,
    stdio: 'inherit',
    // needed to get the colors and stream writes
    shell: process.platform === 'win32' // needed for windows

  }); // If stdio is inherit, comment the data listeners
  // child.stdout.on('data', data => observer.next(data.toString('utf8')))
  // child.stderr.on('data', data => observer.error(data.toString('utf8')))

  child.on('close', () => resolve());
});

const importModules = names => Promise.all(names.map(name => Promise.resolve(require(name))));

const packageObservable = async path => {
  const packagePath = await getClosestPackageJSONDirPath(path);
  const yarn = await access('yarn.lock', packagePath);
  const [dependencies, devDependencies] = await getDependencies(`${path}/package.json`); // const [ seenDep, seenDevDep ] = [new Set(), new Set()]

  const [queuedDeps, queuedDevDeps] = [new Set(), new Set()];
  let pending = Promise.resolve([]);

  const run = async (modules, dev) => {
    const deps = dev ? devDependencies : dependencies;
    const qDeps = dev ? queuedDevDeps : queuedDeps;

    for (const name of modules) qDeps.add(name);

    const allCurrentModules = [...devDependencies, ...dependencies];
    if (!modules.some(name => !allCurrentModules.includes(name))) return importModules(modules);

    try {
      await pending;
    } finally {
      const names = Array.from(qDeps);
      await installPackages(names, {
        path,
        dev,
        yarn
      });

      for (const name of names) deps.add(name);

      for (const name of names) qDeps.delete(name);

      return importModules(modules);
    }
  };

  return (modules, dev = false) => pending = run(modules, dev);
  const [depQueue, devDepQueue] = [new rxjs.Subject(), new rxjs.Subject()].map((subject, dev) => {
    var _ref, _ref2, _subject;

    return (// @ts-ignore
      _ref = (_ref2 = (_subject = subject // @ts-ignore
      , operators.filter(names => {
        const seenDeps = dev ? seenDevDep : seenDep;

        try {
          return Array.from(seenDeps.difference(names)).flat(Infinity);
        } finally {
          for (const name of names) seenDeps.add(name);
        }
      })(_subject) // @ts-ignore
      ), operators.bufferTime(50)(_ref2) // @ts-ignore
      ), operators.filter(arr => arr.length)(_ref)
    );
  });
  const [depUpdate, devDepUpdate] = [depQueue, devDepQueue].map((obs, dev) => {
    var _ref3, _obs;

    return (// @ts-ignore
      _ref3 = (_obs = obs // @ts-ignore
      , operators.mergeMap(async names => {
        const deps = dev ? devDependencies : dependencies;
        await installPackages(names, {
          path,
          dev,
          yarn
        }).toPromise();

        for (const name of names) deps.add(name);

        return rxjs.from(names);
      })(_obs) // @ts-ignore
      ), operators.shareReplay()(_ref3)
    );
  }); // @ts-ignore

  depUpdate.subscribe(); // @ts-ignore

  devDepUpdate.subscribe();
  return (modules, dev) => new Promise((resolve, reject) => {
    if (typeof modules === 'string') modules = [modules];
    const deps = dev ? devDependencies : dependencies;
    const queue = dev ? devDepQueue : depQueue;
    const depsUpdate = dev ? devDepUpdate : depUpdate;
    const missingDeps = new Set(modules.map(name => name.split('/').shift())).difference(deps);

    if (missingDeps.size) {
      var _ref4, _ref5, _ref6, _depsUpdate;

      const obs = (_ref4 = (_ref5 = (_ref6 = (_depsUpdate = depsUpdate // @ts-ignore
      , operators.switchMap(obs => obs)(_depsUpdate) // @ts-ignore
      ), operators.filter(name => missingDeps.has(name))(_ref6) // @ts-ignore
      ), operators.skip(missingDeps.size - 1)(_ref5) // @ts-ignore
      ), operators.take(1)(_ref4)); // @ts-ignore

      obs.subscribe(() => resolve(importModules(modules))); // @ts-ignore

      for (const name of missingDeps) queue.next(name);
    } else {
      resolve(importModules(modules));
    }
  });
};

const packages = new Map();

const getPackage = async path => packages.has(path) ? packages.get(path) : packages.set(path, (await packageObservable(path))).get(path);

var installImport = (async (names, options) => getPackage((options === null || options === void 0 ? void 0 : options.path) || (await getClosestPackageJSONDirPath())).then(getPackage => getPackage(Array.isArray(names) ? names : [names], options === null || options === void 0 ? void 0 : options.dev)).then(packages => Array.isArray(names) ? packages : packages[0]));

var AsyncObservable = (func => rxjs.Observable.create(observer => {
  const unsubscribe = func(observer);
  return async () => {
    var _ref;

    return (_ref = await unsubscribe) === null || _ref === void 0 ? void 0 : _ref();
  };
}));

operators.mergeMap(_value => AsyncObservable(async observer => {
  const value = await _value;
  if (value) observer.next(value);
}));

const stringify = data => flatted.stringify(data, (key, val) => typeof val === 'function' ? {
  [EPK_FUNCTION_PROPERTY_PLACEHOLDER]: val.name
} : val);
const parse = data => flatted.parse(data, (_, val) => (val === null || val === void 0 ? void 0 : val[EPK_FUNCTION_PROPERTY_PLACEHOLDER] // Way to dynamically set a function name (to render via `util.inspect` from the reporter)
) ? {
  [val[EPK_FUNCTION_PROPERTY_PLACEHOLDER]]: () => {}
}[val[EPK_FUNCTION_PROPERTY_PLACEHOLDER]] : val);

let pptr;
var chrome = (({
  port
}) => AsyncObservable(async observer => {
  if (!pptr) pptr = await installImport('puppeteer');
  const rootBrowser = await pptr.launch({
    devtools: true
  });
  observer.next(AsyncObservable(async observer => {
    const emptyHTMLFilePath = path.resolve(__dirname, '..', 'lib', 'empty.html');
    const emptyPageUrl = pathToEpkUrl(emptyHTMLFilePath, {
      port
    });
    const browser = await rootBrowser.createIncognitoBrowserContext();
    const page = await browser.newPage();
    const inMessages = new rxjs.ReplaySubject();
    page.exposeFunction(EPK_RUNTIME_SUBJECT, value => inMessages.next(parse(value)));
    let subjectHandle;
    const outMessages = new rxjs.Subject();
    outMessages.subscribe(value => page.evaluate((subject, value) => subject.next(value), subjectHandle, stringify(value)));
    observer.next({
      inMessages,
      outMessages,
      loadFile: async testFile => {
        await page.goto(emptyPageUrl);
        await page.addScriptTag({
          url: testFile.url
        });
        subjectHandle = await page.evaluateHandle(subjectGlobalProperty => globalThis[subjectGlobalProperty], EPK_SUBJECT);
      }
    });
    return () => page.close();
  }));
  return () => rootBrowser.close();
})); // Observable.create(observer => {
//   if (!pptr) installImport('puppeteer').then(_pptr => pptr = _pptr)
//   const browser = pptr.then(pptr => pptr.launch({ devtools: true }))
//   browser.then(browser =>
//     observer.next(Observable.create(observer => {
//       const page = browser.newPage()
//       const emptyHTMLFilePath = path.resolve(__dirname, '..', 'dist', 'empty.html')
//       const url = transformPathToEpkUrl(emptyHTMLFilePath, options.port)
//       page.then(page => {
//         observer.next({
//           loadFile: file => page.goto(url).then(() => page.addScriptTag({ url: file.url })),
//           exec: str => page.evaluate(str)
//         })
//       })
//       return () =>
//         page.then(page =>
//           page.close())
//     })))
//   return () =>
//     browser.then(browser =>
//       browser.close())
// })

const runtimeMap = new Map([[RUNTIME.CHROME, chrome]]);

for (const [runtimeName, runtime] of runtimeMap) {
  runtimeMap.set(runtimeName, (...args) => {
    var _runtime;

    return (// @ts-ignore
      _runtime = runtime(...args) // @ts-ignore
      , operators.map(provider => {
        provider.runtimeName = runtimeName;
        return provider;
      })(_runtime)
    );
  });
  runtimeMap.get(runtimeName).runtimeName = runtimeName;
}

var getRuntimeProvider = (runtime => runtimeMap.get(runtime));

var preprocessor = (testFile => operators.mergeMap(({
  loadFile,
  inMessages,
  outMessages
}) => AsyncObservable(async observer => {
  var _ref, _ref2, _ref3, _inMessages, _ref4, _ref5, _ref6, _ref7, _inMessages2, _tests, _ref8, _ref9, _tests2;

  const preprocessingStart = perf_hooks.performance.now();
  await loadFile(testFile);
  const tests = ( // @ts-ignore
  _ref = (_ref2 = (_ref3 = (_inMessages = inMessages // @ts-ignore
  , operators.filter(({
    type
  }) => type === MESSAGE.GET_TESTS_RESPONSE)(_inMessages) // @ts-ignore
  ), operators.pluck('tests')(_ref3) // @ts-ignore
  ), operators.take(1)(_ref2) // @ts-ignore
  ), operators.startWith(undefined)(_ref));
  const logs = ( // @ts-ignore
  _ref4 = (_ref5 = (_ref6 = (_ref7 = (_inMessages2 = inMessages // @ts-ignore
  , operators.takeUntil((_tests = tests, operators.skip(1)(_tests)))(_inMessages2) // @ts-ignore
  ), operators.filter(({
    type
  }) => type === MESSAGE.LOG)(_ref7) // @ts-ignore
  ), operators.pluck('log')(_ref6) // @ts-ignore
  ), operators.scan((arr, log) => [...arr, log], [])(_ref5) // @ts-ignore
  ), operators.startWith([])(_ref4));
  const result = (_ref8 = (_ref9 = (_tests2 = tests // @ts-ignore
  , operators.take(2)(_tests2) // @ts-ignore
  ), operators.combineLatest(logs)(_ref9) // @ts-ignore
  ), operators.map(([tests, logs]) => ({ ...testFile,
    tests,
    logs,
    preprocessingStart,
    preprocessingEnd: tests && perf_hooks.performance.now()
  }))(_ref8)); // @ts-ignore

  result.subscribe(analyzedTestFile => observer.next(analyzedTestFile), err => observer.error(err), () => observer.complete());
  outMessages.next({
    type: MESSAGE.GET_TESTS
  });
})));

var test = ((testFile, test) => operators.mergeMap(({
  loadFile,
  inMessages,
  outMessages
}) => AsyncObservable(async observer => {
  var _ref, _ref2, _ref3, _inMessages, _ref4, _ref5, _ref6, _ref7, _inMessages2, _tests, _ref8, _ref9, _tests2;

  await loadFile(testFile);
  const tests = ( // @ts-ignore
  _ref = (_ref2 = (_ref3 = (_inMessages = inMessages // @ts-ignore
  , operators.filter(({
    type
  }) => type === MESSAGE.RUN_TEST_RESPONSE)(_inMessages) // @ts-ignore
  ), operators.pluck('test')(_ref3) // @ts-ignore
  ), operators.take(1)(_ref2) // @ts-ignore
  ), operators.startWith(undefined)(_ref));
  const logs = ( // @ts-ignore
  _ref4 = (_ref5 = (_ref6 = (_ref7 = (_inMessages2 = inMessages // @ts-ignore
  , operators.takeUntil((_tests = tests, operators.skip(1)(_tests)))(_inMessages2) // @ts-ignore
  ), operators.filter(({
    type
  }) => type === MESSAGE.LOG)(_ref7) // @ts-ignore
  ), operators.pluck('log')(_ref6) // @ts-ignore
  ), operators.scan((arr, log) => [...arr, log], [])(_ref5) // @ts-ignore
  ), operators.startWith([])(_ref4));
  const result = (_ref8 = (_ref9 = (_tests2 = tests // @ts-ignore
  , operators.take(2)(_tests2) // @ts-ignore
  ), operators.combineLatest(logs)(_ref9) // @ts-ignore
  ), operators.map(([_test, logs]) => ({
    description: test.description,
    body: test.body,
    type: _test === null || _test === void 0 ? void 0 : _test.type,
    value: _test === null || _test === void 0 ? void 0 : _test.value,
    logs: logs,
    executionStart: _test === null || _test === void 0 ? void 0 : _test.executionStart,
    executionEnd: _test === null || _test === void 0 ? void 0 : _test.executionEnd
  }))(_ref8)); // @ts-ignore

  result.subscribe(test => observer.next(test), err => observer.error(err), () => observer.complete());
  outMessages.next({
    type: MESSAGE.RUN_TEST,
    description: test.description
  });
})));

var Tester = (options => rxjs.Observable.create(observer => {
  var _ref, _Parcel, _ref2, _ref3, _ref4, _parcel, _ref7, _from, _ref8, _ref9, _ref10, _runtimeProvider;

  const {
    watch,
    target = TARGET.BROWSER,
    entryFiles,
    port,
    outDir = '.epk'
  } = options;
  const unsubscribe = new rxjs.Subject();
  const parcel = // @ts-ignore
  (_ref = (_Parcel = Parcel({
    entryFiles: entryFiles,
    target: target,
    outDir: `${outDir}/dist/${target}`,
    watch: true,
    cache: true,
    cacheDir: `${outDir}/cache/${target}`
  }) // @ts-ignore
  , operators.takeUntil(unsubscribe)(_Parcel) // @ts-ignore
  ), operators.publish()(_ref)). // @ts-ignore
  refCount(); // @ts-ignore

  const bundle = ( // @ts-ignore
  _ref2 = (_ref3 = (_ref4 = (_parcel = parcel // @ts-ignore
  , operators.filter(({
    name
  }) => name === 'buildStart')(_parcel) // @ts-ignore
  ), operators.tap(() => observer.next({
    type: REPORTER_EVENT.BUILD_START
  }))(_ref4) // @ts-ignore
  ), operators.switchMap(({
    entryFiles,
    buildStartTime
  }) => {
    var _ref5, _ref6, _parcel2;

    return (// @ts-ignore
      _ref5 = (_ref6 = (_parcel2 = parcel // @ts-ignore
      , operators.filter(({
        name
      }) => name === 'bundled')(_parcel2) // @ts-ignore
      ), operators.tap(() => observer.next({
        type: REPORTER_EVENT.BUILD_SUCCESS
      }))(_ref6) // @ts-ignore
      ), operators.map(bundle => ({ ...bundle,
        entryFiles,
        buildStartTime
      }))(_ref5)
    );
  })(_ref3) // @ts-ignore
  ), operators.shareReplay(1)(_ref2)); // needed for slow runtimes to start working on initial bundle

  const runtimeNames = options.target === TARGET.NODE ? [RUNTIME.NODE] : options.browsers || [RUNTIME.CHROME];
  const runtimeProvider = ( // @ts-ignore
  _ref7 = (_from = rxjs.from(runtimeNames.map(runtimeName => getRuntimeProvider(runtimeName)).map(makeRuntimeProvider => makeRuntimeProvider(options))) // @ts-ignore
  , operators.mergeMap(runtimeProvider => runtimeProvider)(_from) // todo: check how to remove that
  // @ts-ignore
  ), operators.takeUntil(unsubscribe)(_ref7));
  const testFileCache = new Map(); // @ts-ignore

  const tests = ( // @ts-ignore
  _ref8 = (_ref9 = (_ref10 = (_runtimeProvider = runtimeProvider // @ts-ignore
  , operators.mergeMap(runtimeProvider => {
    var _bundle;

    return _bundle = bundle // @ts-ignore
    , operators.switchMap(testBundle => {
      var _ref11, _ref12, _from2;

      const {
        parcelBundle
      } = testBundle;
      const childBundles = // @ts-ignore
      parcelBundle.isEmpty ? Array.from(parcelBundle.childBundles) : [parcelBundle];
      const testFiles = childBundles.map(({
        name: path,
        entryAsset: {
          name
        }
      }) => ({
        bundle: testBundle,
        hashes: new Set(Array.from(testBundle.parcelBundle.assets, asset => asset.hash)),
        name,
        path,
        url: TARGET.BROWSER === target && pathToTestUrl(path, options),
        target: runtimeProvider.runtimeName
      })); // @ts-ignore

      return _ref11 = (_ref12 = (_from2 = rxjs.from(testFiles) // @ts-ignore
      , operators.mergeMap(testFile => {
        var _ref13, _ref14, _ref15, _of, _ref17, _ref18, _merge, _preprocessed, _of2, _merge2;

        // filename
        const {
          name
        } = testFile; // todo: load file from on drive cache
        // cached state of this file

        const cachedTestFile = testFileCache.get(name) || testFileCache.set(name, { ...testFile,
          hashes: new Set()
        }) // .set(name, testFile)
        .get(name);
        const hashDifference = testFile.hashes.difference(cachedTestFile.hashes);
        const updateCache = operators.tap(test => {
          // replace the unexecuted test by the executed one
          const cachedTestFile = testFileCache.get(name);
          cachedTestFile.tests = cachedTestFile.tests.map(_test => _test.description === test.description ? test : _test);
        }); // Get metadata about the needed test files

        const preprocessed = ( // @ts-ignore
        _ref13 = (_ref14 = (_ref15 = (_of = rxjs.of(testFile) // @ts-ignore
        , operators.filter(() => hashDifference.size)(_of) // @ts-ignore
        ), operators.switchMap((testFile // @ts-ignore
        ) => {
          var _ref16, _runtimeProvider2;

          return _ref16 = (_runtimeProvider2 = runtimeProvider // @ts-ignore
          , preprocessor(testFile)(_runtimeProvider2) // @ts-ignore
          ), operators.takeWhile(({
            preprocessingEnd
          }) => !preprocessingEnd, true)(_ref16);
        })(_ref15) // @ts-ignore
        ), operators.tap(testFile => testFileCache.set(name, testFile))(_ref14) // @ts-ignore
        ), operators.share()(_ref13));
        const tested = ( // @ts-ignore
        _ref17 = (_ref18 = (_merge = rxjs.merge((_preprocessed = preprocessed // @ts-ignore
        , operators.filter(({
          preprocessingEnd
        }) => preprocessingEnd)(_preprocessed)), ( // @ts-ignore
        _of2 = rxjs.of(cachedTestFile) // @ts-ignore
        , operators.filter(() => !hashDifference.size)(_of2))) // @ts-ignore
        , operators.switchMap((testFile // @ts-ignore
        ) => {
          var _from3;

          return _from3 = rxjs.from(testFile.tests) // @ts-ignore
          , operators.mergeMap((_test // test hasn't changed and is in the cache
          ) => {
            var _ref19, _ref20;

            return _ref19 = (_ref20 = !hashDifference.size && cachedTestFile.tests.find(test => test.description === _test.description && 'executionEnd' in test) || // test has changed or wasn't in the cache
            // @ts-ignore
            runtimeProvider // @ts-ignore
            , test(testFile, _test)(_ref20) // @ts-ignore
            ), operators.takeWhile(({
              executionEnd
            }) => !executionEnd, true)(_ref19);
          })(_from3);
        })(_merge) // @ts-ignore
        ), updateCache(_ref18) // @ts-ignore
        ), operators.share()(_ref17)); // const analyzed =
        //   // @ts-ignore
        //   merge(
        //     tested,
        //     // @ts-ignore
        //     of(cachedTestFile)
        //     // @ts-ignore
        //     |> filter(() => !hashDifference.size)
        //     // @ts-ignore
        //     |> mergeMap(({ tests }) => from(tests))
        //   )
        //   // @ts-ignore
        //   |> mergeMap((test: Test) =>
        //     // test hasn't changed and is in the cache
        //     (!hashDifference.size &&
        //       cachedTestFile.tests.find((test) =>
        //         test.description === _test.description &&
        //         'analyzeEnd' in test)) ||
        //     // @ts-ignore
        //     runtimeProvider
        //     // @ts-ignore
        //     |> analyze(test)
        //     // @ts-ignore
        //     |> takeWhile(({ analyzeEnd }) => !analyzeEnd, true)
        //   )
        //   // @ts-ignore
        //   |> updateCache
        // @ts-ignore

        return _merge2 = rxjs.merge(rxjs.of(hashDifference.size ? testFile : cachedTestFile), preprocessed, tested), // @ts-ignore
        operators.map(() => testFileCache.get(name))(_merge2);
      })(_from2) // @ts-ignore
      ), operators.scan((testFiles, testFile) => testFiles.set(testFile.name, testFile), new Map())(_ref12) // @ts-ignore
      ), operators.map(testFiles => [runtimeProvider.runtimeName, testFiles])(_ref11);
    })(_bundle);
  })(_runtimeProvider) // @ts-ignore
  ), operators.scan((runtimes, [runtime, fileTests]) => runtimes.set(runtime, fileTests), new Map())(_ref10) // @ts-ignore
  ), operators.map(runtimes => Array.from(runtimes).reduce((aggregations, [runtime, testFiles]) => {
    for (const testFile of testFiles.values()) {
      if (!aggregations.has(testFile.name)) {
        aggregations.set(testFile.name, {
          bundle: testFile.bundle,
          hashes: testFile.hashes,
          name: testFile.name,
          path: testFile.path,
          url: testFile.url,
          testFiles: new Map()
        });
      }

      aggregations.get(testFile.name).testFiles.set(runtime, testFile);
    }

    return aggregations;
  }, new Map()))(_ref9) // @ts-ignore
  ), operators.map(testFiles => ({
    type: REPORTER_EVENT.STATE,
    testFiles
  }))(_ref8)); // @ts-ignore

  tests.subscribe(value => observer.next(value), error => observer.error(error), () => observer.complete());
  return () => {
    unsubscribe.next();
    unsubscribe.complete();
  };
}));

var File = (({
  testFile
}) => React__default.createElement(ink.Box, null, prettifyPath(testFile.name)));

var Reporter = (({
  subject
}) => {
  const [state, setState] = React.useState({
    testFiles: new Map()
  });
  const [error, setError] = React.useState();
  React.useEffect(() => {
    const subscription = subject.subscribe(report => setState(report), error => setError(error));
    return () => subscription.unsubscribe();
  }, []);
  return React__default.createElement(ink.Box, null, state.testFiles.size && React__default.createElement(BorderBox, {
    borderStyle: "round"
  }, Array.from(state.testFiles).map(([, testFile]) => React__default.createElement(File, {
    key: testFile.name,
    testFile: testFile
  }))) || '', error && React__default.createElement(ink.Color, {
    red: true
  }, React__default.createElement(ink.Box, {
    flexDirection: "column"
  }, React__default.createElement(ink.Box, {
    padding: 1
  }, "An internal error with EPK happened, you should probably report this error here https://github.com/FKN48/EPK/issues"), React__default.createElement(ink.Box, null, error.stack))));
});

var CLIReporter = (subject => ink.render(React__default.createElement(Reporter, {
  subject: subject
})));

let imports;
var Server = (options => AsyncObservable(async observer => {
  const {
    port
  } = options;
  if (!imports) imports = await installImport(['koa', 'koa-static', 'koa-mount']);
  const [Koa, serve, mount] = imports;
  const app = new Koa();
  const epk = new Koa();
  epk.use(serve(path.resolve(__dirname, '..', 'lib')));
  const tests = new Koa();
  tests.use(serve(path.resolve(cwd, '.epk', 'dist')));
  app.use(mount('/epk', epk));
  app.use(mount('/tests', tests));
  await app.listen(port);
  observer.next(app);
  return () => app.close();
}));

process.on('unhandledRejection', error => {
  console.error(error);
  process.exit(1);
});
program.version(pkg.version);
const commonOptions = {
  '--no-cache': 'disable the filesystem cache',
  '--cache-dir <path>': 'set the cache directory. defaults to ".parcel-cache"',
  '--no-source-maps': 'disable sourcemaps',
  '--no-autoinstall': 'disable autoinstall',
  '--public-url <url>': 'set the public URL to serve on. defaults to "/"',
  '--log-level <level>': ['set the log level, either "none", "error", "warn", "info", or "verbose".', /^(none|error|warn|info|verbose)$/],
  '-T, --target': ['target for the test, either "browser" or "node"', /^(browser|node)$/],
  '-V, --version': 'output the version number'
};
program.command('help [command]').description('display help information for a command').action(command => (program.commands.find(c => c.name() === command) || program).help());
program.on('--help', function () {
  console.log('');
  console.log(`  Run \`${chalk.bold('epk help <command>')}\` for more information on specific commands`);
  console.log('');
});

const run = async (entries, command) => {
  var _subject, _Server, _serverObservable;

  entries = entries.map(entry => path.resolve(entry));
  if (entries.length === 0) return console.log('No entries found');
  const subject = new rxjs.Subject();
  CLIReporter(( // @ts-ignore
  _subject = subject // @ts-ignore
  , operators.filter(({
    type
  }) => type === REPORTER_EVENT.STATE)(_subject)));
  await new Promise(resolve => setTimeout(resolve, 0));
  subject.next({
    type: REPORTER_EVENT.PORT_SEARCH
  });
  const port = await getPort({
    port: command.port || 10485
  });
  subject.next({
    type: REPORTER_EVENT.PORT_FOUND,
    port
  }); // @ts-ignore

  const serverObservable = (_Server = Server({
    port
  }), operators.shareReplay(1)(_Server));
  subject.next({
    type: REPORTER_EVENT.WEB_SERVER_START
  });
  serverObservable.subscribe(); // @ts-ignore

  await (_serverObservable = serverObservable, operators.take(1)(_serverObservable)).toPromise();
  subject.next({
    type: REPORTER_EVENT.WEB_SERVER_READY,
    port
  });
  const testerObservable = // @ts-ignore
  Tester({
    entryFiles: entries,
    watch: command.watch,
    target: command.target,
    port
  }); // @ts-ignore

  testerObservable.subscribe(report => subject.next(report), error => {
    subject.error(error);
    process.exit(1);
  }, () => subject.complete());
};

const watch = program.command('watch [input...]').description('starts the tester in watch mode').action(run);
applyOptions(watch, commonOptions);
const test$1 = program.command('test [input...]').description('test once').action(run);
applyOptions(test$1, commonOptions);

function applyOptions(cmd, options) {
  for (let opt in options) {
    cmd.option(opt, ...(Array.isArray(options[opt]) ? options[opt] : [options[opt]]));
  }
} // Make watch the default command except for --help


let args = process.argv;
if (args[2] === '--help' || args[2] === '-h') args[2] = 'help';

if (!args[2] || !program.commands.some(c => c.name() === args[2])) {
  args.splice(2, 0, 'watch');
}

program.parse(args);
//# sourceMappingURL=cli.js.map
