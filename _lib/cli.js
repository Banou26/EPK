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
var _Parcel = _interopDefault(require('@parcel/core'));
var fs = _interopDefault(require('fs'));
var util = require('util');
var ink = require('ink');
var React = require('react');
var React__default = _interopDefault(React);
var getStrLength = _interopDefault(require('string-width'));
var ColorPipe = _interopDefault(require('ink-color-pipe'));
var child_process = require('child_process');
var module$1 = require('module');
require('flatted');

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
	"rollup-plugin-babel": "^4.3.2",
	standard: "^14.0.2"
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
	"ink-color-pipe": "^0.2.0",
	koa: "^2.7.0",
	"koa-mount": "^4.0.0",
	"koa-static": "^5.0.0",
	parcel: "^2.0.0-alpha.1.1",
	"power-assert": "^1.6.1",
	puppeteer: "^1.15.0",
	react: "^16.8.6",
	"rollup-plugin-json": "^4.0.0",
	rxjs: "^6.5.1",
	"stacktrace-parser": "^0.1.6",
	"string-width": "^4.1.0",
	"tiny-glob": "^0.2.6",
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

// Subject that is sent data from the tester to the runtime
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

const {
  default: Parcel
} = _Parcel;
var Parcel$1 = ((options = undefined) => rxjs.Observable.create(observer => {
  const parcel = new Parcel(options);

  const emitError = err => observer.error(err);

  const unsub = parcel.watch((err, buildEvent) => {
    if (err) emitError(err);
    const {
      type
    } = buildEvent;

    if (type === 'buildFailure') {
      emitError(buildEvent);
    } else if (type === 'buildSuccess') {
      observer.next(buildEvent);
    }
  });
  return () => unsub().catch(emitError);
}));

const _access = util.promisify(fs.access);

const cwd = process.cwd();
const access = (filename, _path = '') => _access(path.resolve(_path, filename), fs.constants.F_OK).then(() => true, () => false);
const prettifyPath = _path => path.relative(cwd, _path);
const pathToTestUrl = (_path, {
  outDir = '.epk',
  port = undefined
}) => `${port ? `http://localhost:${port}` : ''}${path.normalize(_path).replace(`${path.resolve(cwd, outDir, 'dist')}${path.sep}`, '/tests/').replace(path.sep, '/')}`;

var manageRuntimes = (({
  target,
  bundle,
  runtimeProvider,
  options
}) => {
  var _ref, _ref2, _ref3, _runtimeProvider;

  return (// @ts-ignore
    _ref = (_ref2 = (_ref3 = (_runtimeProvider = runtimeProvider // @ts-ignore
    , mergeMap(runtimeProvider => {
      var _ref4, _ref5, _bundle;

      return _ref4 = (_ref5 = (_bundle = bundle // @ts-ignore
      , mergeScan(([map], testBundle) => {
        var _ref6, _of;

        const {
          parcelBundle
        } = testBundle;
        const childBundles = // @ts-ignore
        parcelBundle.isEmpty ? Array.from(parcelBundle.childBundles) : [parcelBundle];
        const testFilesMap = new Map(childBundles.map(({
          assets,
          name: path,
          entryAsset: {
            name
          }
        }) => ({
          bundle: testBundle,
          hashes: new Set(Array.from(assets, ({
            hash
          }) => hash)),
          name,
          displayName: prettifyPath(name),
          path,
          url: TARGET.BROWSER === target && pathToTestUrl(path, options),
          target: runtimeProvider.runtimeName
        })).map(testFile => [testFile.name, testFile]));

        for (const [path, testFile] of testFilesMap) {
          if (!map.has(path)) {
            map.set(path, {
              unsubscribe: new rxjs.Subject()
            });
          }
        }

        for (const [path, testFile] of map) {
          if (!testFilesMap.has(path)) {
            map.get(path).unsubscribe.next();
            map.get(path).unsubscribe.complete();
            map.delete(path);
          }
        }

        return (// @ts-ignore
          _ref6 = (_of = of(testBundle) // @ts-ignore
          , map(value => {
            // const processing = process()
            return [acc, value];
          })(_of) // @ts-ignore
          ), takeUntil(bundle)(_ref6)
        );
      }, [new Map()])(_bundle) // @ts-ignore
      ), map(([, value]) => value)(_ref5) // @ts-ignore
      ), switchMap(testBundle => {
        var _ref7, _from;

        const {
          parcelBundle
        } = testBundle;
        const childBundles = // @ts-ignore
        parcelBundle.isEmpty ? Array.from(parcelBundle.childBundles) : [parcelBundle];
        const testFiles = childBundles.map(({
          assets,
          name: path,
          entryAsset: {
            name
          }
        }) => ({
          bundle: testBundle,
          hashes: new Set(Array.from(assets, ({
            hash
          }) => hash)),
          name,
          displayName: prettifyPath(name),
          path,
          url: TARGET.BROWSER === target && pathToTestUrl(path, options),
          target: runtimeProvider.runtimeName
        })); // @ts-ignore

        return _ref7 = (_from = from(testFiles) // @ts-ignore
        , scan((testFiles, testFile) => testFiles.set(testFile.name, testFile), new Map())(_from) // @ts-ignore
        ), map(testFiles => [runtimeProvider.runtimeName, testFiles])(_ref7);
      })(_ref4);
    })(_runtimeProvider) // @ts-ignore
    ), scan((runtimes, [runtime, fileTests]) => runtimes.set(runtime, fileTests), new Map())(_ref3) // @ts-ignore
    ), map(runtimes => Array.from(runtimes).reduce((aggregations, [runtime, testFiles]) => {
      for (const testFile of testFiles.values()) {
        if (!aggregations.has(testFile.name)) {
          aggregations.set(testFile.name, {
            bundle: testFile.bundle,
            hashes: testFile.hashes,
            name: testFile.name,
            displayName: testFile.displayName,
            path: testFile.path,
            url: testFile.url,
            tests: testFile.tests,
            testFiles: new Map()
          });
        }

        aggregations.get(testFile.name).testFiles.set(runtime, testFile);
      }

      return aggregations;
    }, new Map()))(_ref2) // @ts-ignore
    ), map(testFiles => ({
      type: REPORTER_EVENT.STATE,
      testFiles
    }))(_ref)
  );
});

var Tester = (options => {
  var _Parcel, _parcelBundle, _build, _build2, _parcelBundle3;

  const parcelBundle = // @ts-ignore
  (_Parcel = Parcel$1(options) // @ts-ignore
  , operators.publish()(_Parcel)). // @ts-ignore
  refCount();
  const build = (_parcelBundle = parcelBundle // @ts-ignore
  , operators.filter(({
    name
  }) => name === 'buildStart')(_parcelBundle));
  const buildStart = (_build = build // @ts-ignore
  , mapTo({
    type: REPORTER_EVENT.BUILD_START
  })(_build));
  const bundle = (_build2 = build // @ts-ignore
  , operators.switchMap(({
    entryFiles,
    buildStartTime
  }) => {
    var _ref, _parcelBundle2;

    return (// @ts-ignore
      _ref = (_parcelBundle2 = parcelBundle // @ts-ignore
      , operators.filter(({
        name
      }) => name === 'bundled')(_parcelBundle2) // @ts-ignore
      ), operators.map(bundle => ({ ...bundle,
        entryFiles,
        buildStartTime
      }))(_ref)
    );
  })(_build2));
  const buildSuccess = (_parcelBundle3 = parcelBundle // @ts-ignore
  , mapTo({
    type: REPORTER_EVENT.BUILD_SUCCESS
  })(_parcelBundle3));
  const tests = manageRuntimes({
    target,
    bundle,
    runtimeProvider,
    options
  });
  return rxjs.merge(buildStart, buildSuccess); // const bundle =
  //   // @ts-ignore
  //   parcelBundle
  //   // @ts-ignore
  //   |> filter(({ name }) => name === 'buildStart')
  //   // @ts-ignore
  //   |> tap(() => observer.next({ type: REPORTER_EVENT.BUILD_START }))
  //   // @ts-ignore
  //   |> switchMap(({ entryFiles, buildStartTime }) =>
  //     // @ts-ignore
  //     parcelBundle
  //     // @ts-ignore
  //     |> filter(({ name }) => name === 'bundled')
  //     // @ts-ignore
  //     |> tap(() => observer.next({ type: REPORTER_EVENT.BUILD_SUCCESS }))
  //     // @ts-ignore
  //     |> map(bundle => ({ ...bundle, entryFiles, buildStartTime })))
  //   // @ts-ignore
  //   |> shareReplay(1) // needed for slow runtimes to start working on initial bundle
  // return (
  // )
}); // export default
//   (options: Options) => {
//     const { watch, target = TARGET.BROWSER, entryFiles, port, outDir = '.epk' } = options
//     const runtimeNames =
//       options.target === TARGET.NODE
//         ? [RUNTIME.NODE]
//         : options.browsers as unknown as RUNTIME[] || [RUNTIME.CHROME]
//     const parcelBundle =
//         // @ts-ignore
//         (Parcel({
//           entryFiles: entryFiles,
//           target: target,
//           outDir: `${outDir}/dist/${target}`,
//           watch: true,
//           cache: true,
//           cacheDir: `${outDir}/cache/${target}`
//         })
//         // @ts-ignore
//         |> publish())
//           // @ts-ignore
//           .refCount()
//     return (
//       parcelBundle
//         // @ts-ignore
//         |> filter(({ name }) => name === 'buildStart')
//         // @ts-ignore
//         |> tap(() => observer.next({ type: REPORTER_EVENT.BUILD_START }))
//         // @ts-ignore
//         |> switchMap(({ entryFiles, buildStartTime }) =>
//           // @ts-ignore
//           parcelBundle
//           // @ts-ignore
//           |> filter(({ name }) => name === 'bundled')
//           // @ts-ignore
//           |> tap(() => observer.next({ type: REPORTER_EVENT.BUILD_SUCCESS }))
//           // @ts-ignore
//           |> map(bundle => ({ ...bundle, entryFiles, buildStartTime })))
//         // @ts-ignore
//         |> publishReplay(1) // needed for slow runtimes to start working on initial bundle
//     // @ts-ignore
//   }
// Observable.create(observer => {
//   const { watch, target = TARGET.BROWSER, entryFiles, port, outDir = '.epk' } = options
//   const unsubscribe = new Subject()
//   const parcelBundle =
//     // @ts-ignore
//     (Parcel({
//       entryFiles: entryFiles,
//       target: target,
//       outDir: `${outDir}/dist/${target}`,
//       watch: true,
//       cache: true,
//       cacheDir: `${outDir}/cache/${target}`
//     })
//     // @ts-ignore
//     |> takeUntil(unsubscribe)
//     // @ts-ignore
//     |> publish())
//       // @ts-ignore
//       .refCount()
//   // @ts-ignore
//   const bundle =
//     // @ts-ignore
//     parcelBundle
//     // @ts-ignore
//     |> filter(({ name }) => name === 'buildStart')
//     // @ts-ignore
//     |> tap(() => observer.next({ type: REPORTER_EVENT.BUILD_START }))
//     // @ts-ignore
//     |> switchMap(({ entryFiles, buildStartTime }) =>
//       // @ts-ignore
//       parcelBundle
//       // @ts-ignore
//       |> filter(({ name }) => name === 'bundled')
//       // @ts-ignore
//       |> tap(() => observer.next({ type: REPORTER_EVENT.BUILD_SUCCESS }))
//       // @ts-ignore
//       |> map(bundle => ({ ...bundle, entryFiles, buildStartTime })))
//     // @ts-ignore
//     |> shareReplay(1) // needed for slow runtimes to start working on initial bundle
//   const runtimeNames =
//     options.target === TARGET.NODE
//       ? [RUNTIME.NODE]
//       : options.browsers as unknown as RUNTIME[] || [RUNTIME.CHROME]
//   const runtimeProvider =
//     // @ts-ignore
//     from(runtimeNames, runtimeName => getRuntimeProvider(runtimeName))
//     // @ts-ignore
//     |> mergeMap(makeRuntimeProvider => makeRuntimeProvider(options))
//     // @ts-ignore
//     |> takeUntil(unsubscribe)
//   const tests = manageRuntimes({
//     target,
//     bundle,
//     runtimeProvider,
//     options
//   })
//   // @ts-ignore
//   tests.subscribe(
//     value => observer.next(value),
//     error => observer.error(error),
//     () => observer.complete()
//   )
//   return () => {
//     unsubscribe.next()
//     unsubscribe.complete()
//   }
// })

const RIGHT_ARROW = '\u001B[C';
const LEFT_ARROW = '\u001B[D';
const CTRL_C = '\x03';

const useError = subject => {
  const [error, setError] = React.useState();
  React.useEffect(() => {
    const subscription = subject.subscribe(() => {}, error => setError(error));
    return () => subscription.unsubscribe();
  }, []);
  return [error, error ? React__default.createElement(ink.Color, {
    red: true
  }, React__default.createElement(ink.Box, {
    flexDirection: "column"
  }, React__default.createElement(ink.Box, null, "An internal error happened, you should probably report the error here: https://github.com/FKN48/EPK/issues"))) : ''];
};

const useFilesState = subject => {
  const [{
    testFiles
  }, setFilesState] = React.useState({
    testFiles: new Map()
  });
  React.useEffect(() => {
    const subscription = subject.subscribe(report => setFilesState(report));
    return () => subscription.unsubscribe();
  }, []);
  return Array.from(testFiles.values());
};

const getRenderableNames = (terminalWidth, names, startAt) => Array.from(names).splice(startAt).reduce(([list, max, found = false], name, i) => found ? [list, max, true] : getStrLength(`${list.join(' ')} ${name}`) > terminalWidth ? [list, max, true] : [[...list, [name, i + startAt]], i + startAt, false], [[], 0, false]);

const useTabs = ({
  stdin,
  setRawMode
}, aggregatedTestFiles) => {
  /**
   * Level 0 = folder
   * Level 1 = file
   */
  const [level, setLevel] = React.useState(0);
  const [[selected, scroll], setState] = React.useState([0, 0]);
  const folderTestFileMap = aggregatedTestFiles.map(({
    name,
    displayName
  }) => [path.dirname(name), displayName]).reduce((map, [folder, file]) => (map.get(folder) || map.set(folder, []).get(folder)).push(file) && map, new Map());
  const terminalWidth = process.stdout.columns;
  const terminalHeight = process.stdout.rows;
  const folderNames = Array.from(folderTestFileMap.keys());
  const fileNames = Array.from(folderTestFileMap.values()).flat();
  const names = level ? folderNames : fileNames;
  const [, _maxRenderableNames] = getRenderableNames(terminalWidth, names, scroll);
  const needScroller = _maxRenderableNames !== names.length;
  const [renderNames, maxRenderableNames] = getRenderableNames(terminalWidth - getStrLength(`⬅️➡️`), names, scroll);

  const handleKeyPress = data => {
    const s = String(data);

    if (s === CTRL_C) {
      setRawMode(false);
      process.exit();
    }

    if (s === RIGHT_ARROW) {
      setState(([selected, scroll]) => [selected + (selected < names.length - 1 ? 1 : 0), scroll + (selected < names.length - 1 && selected === scroll + maxRenderableNames ? 1 : 0)]);
    }

    if (s === LEFT_ARROW) {
      setState(([selected, scroll]) => [selected - (selected > 0 ? 1 : 0), scroll - (scroll > 0 && selected === scroll ? 1 : 0)]);
    }
  };

  React.useEffect(() => {
    setRawMode(true);
    stdin.on('data', handleKeyPress);
    return () => {
      stdin.removeListener('data', handleKeyPress);
    };
  }); // remove set raw mode, as it might interfere with CTRL-C

  React.useEffect(() => () => setRawMode(false), []);
  return [aggregatedTestFiles[selected], React__default.createElement(ink.Box, {
    width: terminalWidth,
    alignItems: "center",
    justifyContent: "space-around"
  }, React__default.createElement(ink.Box, null, needScroller && renderNames[0][1] !== 0 ? '⬅️' : ''), renderNames.map(([name, i]) => {
    const testFiles = Array.from(aggregatedTestFiles.find(({
      displayName
    }) => displayName === name).testFiles.values());
    const hasErrors = testFiles.some(({
      tests
    }) => tests === null || tests === void 0 ? void 0 : tests.some(({
      logs
    }) => logs === null || logs === void 0 ? void 0 : logs.some(({
      type
    }) => type === LOG.error)));
    return React__default.createElement(ink.Box, {
      key: name
    }, React__default.createElement(ColorPipe, {
      styles: `${hasErrors ? 'red' : 'greenBright'}${i === selected ? '.bold.underline' : ''}`
    }, prettifyPath(name)));
  }).reverse().reduce((arr, value, i) => i ? [...arr, [value, React__default.createElement(ink.Text, {
    key: i
  }, " ")]] : [...arr, [value]], []).reverse().flat(Infinity), React__default.createElement(ink.Box, null, needScroller && renderNames[renderNames.length - 1][1] !== names.length - 1 ? '➡️' : ''))];
};

const useTestFile = aggregatedTestFile => {
  var _aggregatedTestFile$t;

  // todo:
  // replace tests because TestFileRuntimeAggregation#tests are analyzed tests,
  // they're not tested so they'll not have execution error logs
  const color = (aggregatedTestFile === null || aggregatedTestFile === void 0 ? void 0 : aggregatedTestFile.tests) && 'executionEnd' ? aggregatedTestFile.tests.some(({
    logs
  }) => logs === null || logs === void 0 ? void 0 : logs.some(({
    type
  }) => type === LOG.error)) ? 'red' : 'greenBright' : '';
  return aggregatedTestFile ? React__default.createElement(ink.Box, {
    flexDirection: "column"
  }, React__default.createElement(ink.Box, null, React__default.createElement(ColorPipe, {
    styles: color
  }, aggregatedTestFile.displayName)), React__default.createElement(ink.Box, {
    flexDirection: "column",
    paddingLeft: 2
  }, (_aggregatedTestFile$t = aggregatedTestFile.tests) === null || _aggregatedTestFile$t === void 0 ? void 0 : _aggregatedTestFile$t.map(({
    description,
    logs
  }) => React__default.createElement(ink.Box, {
    key: description
  }, React__default.createElement(ColorPipe, {
    styles: logs ? logs.some(({
      type
    }) => type === LOG.error) ? 'red' : 'greenBright' : ''
  }, description))))) : '';
};

var Reporter = (({
  stdin,
  setRawMode,
  subject
}) => {
  const [error, errorElement] = useError(subject);
  const aggregatedTestFiles = useFilesState(subject);
  const [selected, tabsElement] = useTabs({
    stdin,
    setRawMode
  }, aggregatedTestFiles);
  const fileDescription = useTestFile(selected);
  return React__default.createElement(ink.Box, {
    flexDirection: "column"
  }, fileDescription, tabsElement, errorElement);
}); // testFiles.length &&
// Array.from(testFiles).map(testFile =>
//   <File key={testFile.name} testFile={testFile}/>) || ''
// <BorderBox borderStyle="round">
//   {
//     Array.from(state.testFiles).map(([,testFile]) =>
//       <File key={testFile.name} testFile={testFile}/>)
//   }
// </BorderBox> || ''

var CLIReporter = (subject => ink.render(React__default.createElement(ink.StdinContext.Consumer, null, ({
  stdin,
  setRawMode
}) => React__default.createElement(Reporter, {
  stdin: stdin,
  setRawMode: setRawMode,
  subject: subject
}))));

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
    setTimeout(() => process.exit(1), 0);
    throw error;
  }, () => subject.complete());
};

const watch = program.command('watch [input...]').description('starts the tester in watch mode').action(run);
applyOptions(watch, commonOptions);
const test = program.command('test [input...]').description('test once').action(run);
applyOptions(test, commonOptions);

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
