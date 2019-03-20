// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

// eslint-disable-next-line no-global-assign
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  return newRequire;
})({"types.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FileType = exports.MESSAGE_TYPE = exports.targetToBundlerTarget = exports.BUNDLER_TARGET = exports.BROWSER_TARGET = exports.TARGET = exports.NODE_GLOBAL = void 0;
const NODE_GLOBAL = '__EPK_NODE_GLOBAL';
/**
 * List of different runtimes (available) to test on
 */

exports.NODE_GLOBAL = NODE_GLOBAL;
let TARGET;
exports.TARGET = TARGET;

(function (TARGET) {
  TARGET["NODE"] = "node";
  TARGET["ELECTRON"] = "electron";
  TARGET["DENO"] = "deno";
  TARGET["CHROME"] = "chrome";
  TARGET["CHROME_EXTENSION"] = "chromeExtension";
  TARGET["CHROME_CANARY"] = "chromeCanary";
  TARGET["CHROME_CANARY_EXTENSION"] = "chromeCanaryExtension";
  TARGET["FIREFOX"] = "firefox";
  TARGET["FIREFOX_EXTENSION"] = "firefoxExtension";
  TARGET["FIREFOX_NIGHTLY"] = "firefoxNightly";
  TARGET["FIREFOX_NIGHTLY_EXTENSION"] = "firefoxNightlyExtension";
})(TARGET || (exports.TARGET = TARGET = {}));

let BROWSER_TARGET;
exports.BROWSER_TARGET = BROWSER_TARGET;

(function (BROWSER_TARGET) {
  BROWSER_TARGET[BROWSER_TARGET["CHROME"] = TARGET.CHROME_EXTENSION] = "CHROME";
  BROWSER_TARGET[BROWSER_TARGET["CHROME_EXTENSION"] = TARGET.CHROME_CANARY] = "CHROME_EXTENSION";
  BROWSER_TARGET[BROWSER_TARGET["CHROME_CANARY"] = TARGET.CHROME_CANARY_EXTENSION] = "CHROME_CANARY";
  BROWSER_TARGET[BROWSER_TARGET["CHROME_CANARY_EXTENSION"] = TARGET.FIREFOX] = "CHROME_CANARY_EXTENSION";
  BROWSER_TARGET[BROWSER_TARGET["FIREFOX"] = TARGET.FIREFOX_EXTENSION] = "FIREFOX";
  BROWSER_TARGET[BROWSER_TARGET["FIREFOX_EXTENSION"] = TARGET.FIREFOX_NIGHTLY] = "FIREFOX_EXTENSION";
  BROWSER_TARGET[BROWSER_TARGET["FIREFOX_NIGHTLY"] = TARGET.FIREFOX_NIGHTLY_EXTENSION] = "FIREFOX_NIGHTLY";
  BROWSER_TARGET[BROWSER_TARGET["FIREFOX_NIGHTLY_EXTENSION"] = TARGET.FIREFOX_NIGHTLY_EXTENSION] = "FIREFOX_NIGHTLY_EXTENSION";
})(BROWSER_TARGET || (exports.BROWSER_TARGET = BROWSER_TARGET = {}));

let BUNDLER_TARGET;
exports.BUNDLER_TARGET = BUNDLER_TARGET;

(function (BUNDLER_TARGET) {
  BUNDLER_TARGET["NODE"] = "node";
  BUNDLER_TARGET["BROWSER"] = "browser";
  BUNDLER_TARGET["ELECTRON"] = "electron";
})(BUNDLER_TARGET || (exports.BUNDLER_TARGET = BUNDLER_TARGET = {}));

const targetToBundlerTarget = target => target in BROWSER_TARGET ? BUNDLER_TARGET.BROWSER : target === BUNDLER_TARGET.NODE ? BUNDLER_TARGET.NODE : target === BUNDLER_TARGET.ELECTRON && BUNDLER_TARGET.NODE;

exports.targetToBundlerTarget = targetToBundlerTarget;
let MESSAGE_TYPE;
exports.MESSAGE_TYPE = MESSAGE_TYPE;

(function (MESSAGE_TYPE) {
  MESSAGE_TYPE["GET_TESTS"] = "__EPK_GET_TESTS";
  MESSAGE_TYPE["RUN_TESTS"] = "__EPK_RUN_TESTS";
  MESSAGE_TYPE["RUN_TEST"] = "__EPK_RUN_TEST";
  MESSAGE_TYPE["GET_TESTS_RESPONSE"] = "__EPK_GET_TESTS_RESPONSE";
  MESSAGE_TYPE["RUN_TESTS_RESPONSE"] = "__EPK_RUN_TESTS_RESPONSE";
  MESSAGE_TYPE["RUN_TEST_RESPONSE"] = "__EPK_RUN_TEST_RESPONSE";
})(MESSAGE_TYPE || (exports.MESSAGE_TYPE = MESSAGE_TYPE = {}));

let FileType;
/**
 * Representation of a file
 */

exports.FileType = FileType;

(function (FileType) {
  FileType["ANALYZE"] = "ANALYZE";
  FileType["TEST"] = "TEST";
  FileType["DONE"] = "DONE";
})(FileType || (exports.FileType = FileType = {}));
},{}],"core/bundler.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _path = _interopRequireDefault(require("path"));

var _parcelBundler = _interopRequireDefault(require("parcel-bundler"));

var _rxjs = require("rxjs");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = options => _rxjs.Observable.create(observer => {
  const bundler = new _parcelBundler.default(options.entryFiles, options);
  bundler.addAssetType('js', _path.default.resolve(__dirname, '../src/core/js-asset.ts'));
  bundler.addAssetType('ts', _path.default.resolve(__dirname, '../src/core/ts-asset.ts'));
  bundler.on('bundled', bundle => observer.next({
    options,
    name: 'bundled',
    bundle,
    buildEndTime: Date.now()
  }));
  bundler.on('buildStart', entryFiles => observer.next({
    options,
    name: 'buildStart',
    entryFiles,
    buildStartTime: Date.now()
  }));
  bundler.on('buildEnd', _ => observer.next({
    name: 'buildEnd'
  }));
  bundler.on('buildError', error => observer.next({
    name: 'error',
    error
  }));
  bundler.bundle();
  return _ => bundler.stop();
});

exports.default = _default;
},{}],"utils/index.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.transformPathToEpkUrl = exports.transformPathToTestUrl = exports.getEmptyPageUrl = exports.prettifyPath = void 0;

var _path2 = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const prettifyPath = _path => _path2.default.relative(process.cwd(), _path);

exports.prettifyPath = prettifyPath;

const getEmptyPageUrl = port => transformPathToEpkUrl(_path2.default.resolve(__dirname, '..', 'dist', 'empty.html'), port);

exports.getEmptyPageUrl = getEmptyPageUrl;

const transformPathToTestUrl = (_path, port) => `${port ? `http://localhost:${port}` : ''}${_path.replace(`${_path2.default.resolve(process.cwd(), '.epk', 'dist')}\\`, '/tests/').replace('\\', '/')}`;

exports.transformPathToTestUrl = transformPathToTestUrl;

const transformPathToEpkUrl = (_path, port) => `${port ? `http://localhost:${port}` : ''}${_path.replace(`${_path2.default.resolve(__dirname, '..', 'dist')}\\`, '/epk/').replace('\\', '/')}`;

exports.transformPathToEpkUrl = transformPathToEpkUrl;
},{}],"cli/logger.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Chalk = _interopRequireDefault(require("Chalk"));

var _readline = _interopRequireDefault(require("readline"));

var _graphemeBreaker = require("grapheme-breaker");

var _stripAnsi = _interopRequireDefault(require("strip-ansi"));

var _ora = _interopRequireDefault(require("ora"));

var _path = _interopRequireDefault(require("path"));

var _fs = _interopRequireDefault(require("fs"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// from https://github.com/parcel-bundler/parcel/tree/master/packages/core/logger/src
const prettyError = (err, {
  color
} = {
  color: undefined
}) => {
  let message = typeof err === 'string' ? err : err.message;
  if (!message) message = 'Unknown error';

  if (err.fileName) {
    let fileName = err.fileName;

    if (err.loc) {
      fileName += `:${err.loc.line}:${err.loc.column}`;
    }

    message = `${fileName}: ${message}`;
  }

  let stack;

  if (err.codeFrame) {
    stack = color && err.highlightedCodeFrame || err.codeFrame;
  } else if (err.stack) {
    stack = err.stack.slice(err.stack.indexOf('\n') + 1);
  }

  return {
    message,
    stack
  };
};

const supportsEmoji = process.platform !== 'win32' || process.env.TERM === 'xterm-256color'; // Fallback symbols for Windows from https://en.wikipedia.org/wiki/Code_page_437

const defaultEmojis = {
  progress: supportsEmoji ? '⏳' : '∞',
  success: supportsEmoji ? '✨' : '√',
  error: supportsEmoji ? '🚨' : '×',
  warning: supportsEmoji ? '⚠️' : '‼'
};

const countLines = str => (0, _stripAnsi.default)(str).split('\n').reduce((p, line) => process.stdout.columns ? p + Math.ceil((line.length || 1) / process.stdout.columns) : p + 1); // Pad a string with spaces on either side


const pad = (text, length, align = 'left') => {
  const pad = ' '.repeat(length - stringWidth(text));
  if (align === 'right') return `${pad}${text}`;
  return `${text}${pad}`;
}; // Count visible characters in a string


const stringWidth = str => {
  var _ref, _ref2;

  return (// @ts-ignore
    _ref = (_ref2 = `${str}` // @ts-ignore
    , (0, _stripAnsi.default)(_ref2) // @ts-ignore
    ), (0, _graphemeBreaker.countBreaks)(_ref)
  );
};

const Logger = ({
  logLevel = 3,
  color = _Chalk.default.supportsColor,
  emojis = defaultEmojis,
  chalk = new _Chalk.default.constructor({
    enabled: color
  }),
  isTest = process.env.NODE_ENV === 'test'
} = {}) => {
  let lines = 0;
  let spinner;
  let logFile;

  const writeRaw = str => {
    stopSpinner();
    lines += countLines(str) - 1;
    process.stdout.write(str);
  };

  const write = (message, persistent = false) => {
    if (logLevel > 3) {
      return verbose(message);
    }

    if (!persistent) {
      lines += countLines(message);
    }

    stopSpinner();

    _log(message);
  };

  const verbose = str => {
    if (logLevel < 4) return;
    let currDate = new Date();
    str = `[${currDate.toLocaleTimeString()}]: ${str}`;

    if (logLevel > 4) {
      if (!logFile) {
        logFile = _fs.default.createWriteStream(_path.default.join(process.cwd(), `parcel-debug-${currDate.toISOString()}.log`));
      }

      logFile.write((0, _stripAnsi.default)(str) + '\n');
    }

    _log(str);
  };

  const log = str => logLevel >= 3 && write(str);

  const persistent = str => logLevel >= 3 && write(chalk.bold(str), true);

  const warn = err => logLevel >= 2 && _writeError(err, emojis.warning, chalk.yellow);

  const error = err => logLevel >= 1 && _writeError(err, emojis.error, chalk.red.bold);

  const success = str => log(`${emojis.success}  ${chalk.green.bold(str)}`);

  const formatError = (err, options) => prettyError(err, options);

  const _writeError = (err, emoji, _color) => {
    const {
      message,
      stack
    } = formatError(err, {
      color
    });
    write(_color(`${emoji}  ${message}`));
    if (stack) write(stack);
  };

  const clear = () => {
    if (!color || isTest || logLevel > 3) return;

    while (lines > 0) {
      _readline.default.clearLine(process.stdout, 0);

      _readline.default.moveCursor(process.stdout, 0, -1);

      lines--;
    }

    _readline.default.cursorTo(process.stdout, 0);

    stopSpinner();
  };

  const progress = str => {
    if (logLevel < 3) return;else if (logLevel > 3) return verbose(str);
    const styledMessage = chalk.gray.bold(str);

    if (!spinner) {
      spinner = (0, _ora.default)({
        text: styledMessage,
        stream: process.stdout,
        enabled: isTest ? false : undefined // fall back to ora default unless we need to explicitly disable it.

      }).start();
    } else spinner.text = styledMessage;
  };

  const stopSpinner = () => {
    if (spinner) {
      spinner.stop();
      spinner = null;
    }
  };

  const _log = str => console.log(str);

  const table = (columns, table) => {
    // Measure column widths
    let colWidths = [];

    for (let row of table) {
      let i = 0;

      for (let item of row) {
        colWidths[i] = Math.max(colWidths[i] || 0, stringWidth(item));
        i++;
      }
    } // Render rows


    for (let row of table) {
      log(row.map((item, i) => {
        // Add padding between columns unless the alignment is the opposite to the
        // next column and pad to the column width.
        let padding = !columns[i + 1] || columns[i + 1].align === columns[i].align ? 4 : 0;
        return pad(item, colWidths[i] + padding, columns[i].align);
      }).join(''));
    }
  };

  const logger = {
    writeRaw,
    write,
    verbose,
    log,
    persistent,
    warn,
    error,
    success,
    formatError,
    _writeError,
    clear,
    progress,
    stopSpinner,
    _log,
    table,
    handleMessage: undefined
  };

  const handleMessage = ({
    method,
    args
  }) => logger[method](...args);

  logger.handleMessage = handleMessage;
  return logger;
};

var _default = Logger();

exports.default = _default;
},{}],"utils/installPackage.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

var _config = _interopRequireDefault(require("parcel-bundler/src/utils/config"));

var _commandExists = _interopRequireDefault(require("command-exists"));

var _logger = _interopRequireDefault(require("../cli/logger"));

var _pipeSpawn = _interopRequireDefault(require("parcel-bundler/src/utils/pipeSpawn"));

var _PromiseQueue = _interopRequireDefault(require("parcel-bundler/src/utils/PromiseQueue"));

var _path = _interopRequireDefault(require("path"));

var _fs = _interopRequireDefault(require("@parcel/fs"));

var _workers = _interopRequireDefault(require("@parcel/workers"));

var _utils = _interopRequireDefault(require("@parcel/utils"));

var _resolve2 = _interopRequireDefault(require("resolve"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// https://github.com/parcel-bundler/parcel/blob/master/packages/core/parcel-bundler/src/utils/installPackage.js
const {
  promisify
} = _utils.default;
const resolve = promisify(_resolve2.default);
const YARN_LOCK = 'yarn.lock';

async function install(modules, filepath, options = {
  installPeers: true,
  saveDev: true,
  packageManager: undefined
}) {
  let {
    installPeers = true,
    saveDev = true,
    packageManager
  } = options;

  if (typeof modules === 'string') {
    modules = [modules];
  }

  _logger.default.progress(`Installing ${modules.join(', ')}...`);

  let packageLocation = await _config.default.resolve(filepath, ['package.json']);
  let cwd = packageLocation ? _path.default.dirname(packageLocation) : process.cwd();

  if (!packageManager) {
    packageManager = await determinePackageManager(filepath);
  }

  let commandToUse = packageManager === 'npm' ? 'install' : 'add';
  let args = [commandToUse, ...modules];

  if (saveDev) {
    args.push('-D');
  } else if (packageManager === 'npm') {
    args.push('--save');
  } // npm doesn't auto-create a package.json when installing,
  // so create an empty one if needed.


  if (packageManager === 'npm' && !packageLocation) {
    await _fs.default.writeFile(_path.default.join(cwd, 'package.json'), '{}');
  }

  try {
    await (0, _pipeSpawn.default)(packageManager, args, {
      cwd
    });
  } catch (err) {
    throw new Error(`Failed to install ${modules.join(', ')}.`);
  }

  if (installPeers) {
    await Promise.all(modules.map(m => installPeerDependencies(filepath, m, options)));
  }
}

async function installPeerDependencies(filepath, name, options) {
  let basedir = _path.default.dirname(filepath);

  const [resolved] = await resolve(name, {
    basedir
  });
  const pkg = await _config.default.load(resolved, ['package.json']);
  const peers = pkg.peerDependencies || {};
  const modules = [];

  for (const peer in peers) {
    modules.push(`${peer}@${peers[peer]}`);
  }

  if (modules.length) {
    await install(modules, filepath, Object.assign({}, options, {
      installPeers: false
    }));
  }
}

async function determinePackageManager(filepath) {
  const yarnLockFile = await _config.default.resolve(filepath, [YARN_LOCK]);
  /**
   * no yarn.lock => use npm
   * yarn.lock => Use yarn, fallback to npm
   */

  if (!yarnLockFile) {
    return 'npm';
  }

  const hasYarn = await checkForYarnCommand();

  if (hasYarn) {
    return 'yarn';
  }

  return 'npm';
}

let hasYarn = null;

async function checkForYarnCommand() {
  if (hasYarn != null) {
    return hasYarn;
  }

  try {
    hasYarn = await (0, _commandExists.default)('yarn');
  } catch (err) {
    hasYarn = false;
  }

  return hasYarn;
}

let queue = new _PromiseQueue.default(install, {
  maxConcurrent: 1,
  retry: false
});

async function _default(...args) {
  // Ensure that this function is always called on the master process so we
  // don't call multiple installs in parallel.
  if (_workers.default.isWorker()) {
    await _workers.default.callMaster({
      location: __filename,
      args
    });
    return;
  }

  queue.add(...args);
  return queue.run();
} // export default async (...names) => {
//   await _installPackage(names)
//   return names.length === 1
//           ? import(name)
//           : Promise.all(names.map(name => import(name)))
// }
},{"../cli/logger":"cli/logger.ts"}],"utils/getModuleParts.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// https://github.com/parcel-bundler/parcel/blob/master/packages/core/parcel-bundler/src/utils/getModuleParts.js
function _default(name) {
  let parts = _path.default.normalize(name).split(_path.default.sep);

  if (parts[0].charAt(0) === '@') {
    // Scoped module (e.g. @scope/module). Merge the first two parts back together.
    parts.splice(0, 2, `${parts[0]}/${parts[1]}`);
  }

  return parts;
}
},{}],"utils/localRequire.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.resolve = exports.localRequire = void 0;

var _path = require("path");

var _utils = _interopRequireDefault(require("@parcel/utils"));

var _resolve2 = _interopRequireDefault(require("resolve"));

var _installPackage = _interopRequireDefault(require("./installPackage"));

var _getModuleParts = _interopRequireDefault(require("./getModuleParts"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// https://github.com/parcel-bundler/parcel/blob/master/packages/core/parcel-bundler/src/utils/localRequire.js
const {
  promisify
} = _utils.default;

const _resolve = promisify(_resolve2.default);

const cache = new Map();

const localRequire = async (name, path, triedInstall = false) => {
  const [resolved] = await resolve(name, path, triedInstall);
  return require(resolved);
};

exports.localRequire = localRequire;

const resolve = async (name, path, triedInstall = false) => {
  let basedir = (0, _path.dirname)(path);
  let key = basedir + ':' + name;
  let resolved = cache.get(key);

  if (!resolved) {
    try {
      resolved = await _resolve(name, {
        basedir
      });
    } catch (e) {
      if (e.code === 'MODULE_NOT_FOUND' && !triedInstall) {
        const packageName = (0, _getModuleParts.default)(name)[0];
        await (0, _installPackage.default)(packageName, path);
        return resolve(name, path, true);
      }

      throw e;
    }

    cache.set(key, resolved);
  }

  return resolved;
};

exports.resolve = resolve;

var _default = async (packages, path = __filename) => typeof packages === 'string' ? localRequire(packages, path) : Promise.all(packages.map(pkg => localRequire(pkg, path)));

exports.default = _default;
},{"./installPackage":"utils/installPackage.ts","./getModuleParts":"utils/getModuleParts.ts"}],"targets/chrome.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _path2 = _interopRequireDefault(require("path"));

var _rxjs = require("rxjs");

var _localRequire = _interopRequireDefault(require("../utils/localRequire"));

var _utils = require("../utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let pptr;

var _default = options => _rxjs.Observable.create(observer => {
  if (!pptr) pptr = (0, _localRequire.default)('puppeteer', __filename);
  let closed;
  const browser = pptr.then(pptr => pptr.launch({
    devtools: true
  }));
  browser.then(browser => {
    if (closed) return;
    observer.next(_rxjs.Observable.create(observer => {
      const page = browser.newPage();

      const a = _path2.default.resolve(__dirname, '..', 'dist', 'empty.html');

      const _path = (0, _utils.transformPathToEpkUrl)(_path2.default.resolve(__dirname, '..', 'dist', 'empty.html'), options.port);

      page.then(page => {
        observer.next({
          loadFile: file => page.goto((0, _utils.transformPathToEpkUrl)(_path2.default.resolve(process.cwd(), 'dist/empty.html'), options.port)).then(() => page.addScriptTag({
            url: file.url
          })),
          exec: str => page.evaluate(str)
        });
      });
      return () => page.then(page => page.close());
    }));
  });
  return () => {
    closed = true;
    browser.then(browser => browser.close());
  };
});

exports.default = _default;
},{"../utils/localRequire":"utils/localRequire.ts","../utils":"utils/index.ts"}],"core/target-runtime-provider.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _types = require("../types");

var _chrome = _interopRequireDefault(require("../targets/chrome"));

var _operators = require("rxjs/operators");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// import FirefoxRuntime from '../targets/firefox'
const targetRuntimes = new Map([[_types.TARGET.CHROME, _chrome.default]]);

var _default = (target, options) => {
  var _targetRuntimeProvide;

  const targetRuntimeProvider = targetRuntimes.get(target)(options);
  targetRuntimeProvider.target = target;
  targetRuntimeProvider.options = options; // @ts-ignore

  return _targetRuntimeProvide = targetRuntimeProvider // @ts-ignore
  , (0, _operators.map)(targetRuntime => {
    targetRuntime.target = target;
    targetRuntime.options = options;
    return targetRuntime;
  })(_targetRuntimeProvide);
};

exports.default = _default;
},{"../types":"types.ts","../targets/chrome":"targets/chrome.ts"}],"core/utils.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isBrowser = exports.prettifyTime = exports.stringify = void 0;

const stringify = (strings, ...vals) => strings.reduce((finalStr, str, i) => `${finalStr}${str}${vals.length > i ? JSON.stringify(vals[i]) : ''}`, '');

exports.stringify = stringify;

const prettifyTime = time => time < 1000 ? `${time.toFixed()}ms` : `${(time / 1000).toFixed(2)}s`;

exports.prettifyTime = prettifyTime;
const isBrowser = typeof window !== 'undefined';
exports.isBrowser = isBrowser;
},{}],"core/analyze.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _operators = require("rxjs/operators");

var _types = require("../types");

var _utils = require("./utils");

const browserStr = data => _utils.stringify`
new Promise(resolve => {
  window.addEventListener('message', ({ data }) =>
    data.type === ${_types.MESSAGE_TYPE.GET_TESTS_RESPONSE}
    && resolve(data))
  window.postMessage(${data}, '*')
})
`;

const nodeStr = data => _utils.stringify`
new Promise(resolve => {
  global[${_types.NODE_GLOBAL}].addListener('message', ({ data }) =>
    data.type === ${_types.MESSAGE_TYPE.GET_TESTS_RESPONSE}
    && resolve(data))
  global[${_types.NODE_GLOBAL}].emit('message', ${data})
})
`;

const analyzeStr = (options, data) => options.target === _types.BUNDLER_TARGET.BROWSER ? browserStr(data) : nodeStr(data);

var _default = (targetRuntimeProvider, options) => // @ts-ignore
(0, _operators.switchMap)((file // @ts-ignore
) => {
  var _ref, _targetRuntimeProvide;

  return _ref = (_targetRuntimeProvide = targetRuntimeProvider // @ts-ignore
  , (0, _operators.mergeMap)(async targetRuntime => {
    await targetRuntime.loadFile(file);
    const {
      data: tests,
      errors
    } = await targetRuntime.exec(analyzeStr(options, {
      type: _types.MESSAGE_TYPE.GET_TESTS
    }));
    return {
      type: _types.FileType.ANALYZE,
      ...file,
      tests,
      errors
    };
  })(_targetRuntimeProvide) // @ts-ignore
  ), (0, _operators.take)(1)(_ref);
});

exports.default = _default;
},{"../types":"types.ts","./utils":"core/utils.ts"}],"core/test.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _operators = require("rxjs/operators");

var _types = require("../types");

var _utils = require("./utils");

const browserStr = data => _utils.stringify`
new Promise(resolve => {
  window.addEventListener('message', ({ data }) =>
    data.type === ${_types.MESSAGE_TYPE.RUN_TEST_RESPONSE}
    && resolve(data))
  window.postMessage(${data}, '*')
})
`;

const nodeStr = data => _utils.stringify`
new Promise(resolve => {
  global[${_types.NODE_GLOBAL}].addListener('message', ({ data }) =>
    data.type === ${_types.MESSAGE_TYPE.RUN_TEST_RESPONSE}
    && resolve(data))
  global[${_types.NODE_GLOBAL}].emit('message', ${data})
})
`;

const testStr = (options, data) => options.target === _types.BUNDLER_TARGET.BROWSER ? browserStr(data) : nodeStr(data);

var _default = (file, targetRuntimeProvider, options) => (0, _operators.mergeMap)(test => {
  var _ref, _targetRuntimeProvide;

  return (// @ts-ignore
    _ref = (_targetRuntimeProvide = targetRuntimeProvider // @ts-ignore
    , (0, _operators.mergeMap)(async targetRuntime => {
      await targetRuntime.loadFile(file);
      const {
        data: result
      } = await targetRuntime.exec(testStr(options, {
        type: _types.MESSAGE_TYPE.RUN_TEST,
        description: test.description
      }));
      return { ...file,
        type: _types.FileType.TEST,
        test: { ...test,
          ...result
        }
      };
    })(_targetRuntimeProvide) // @ts-ignore
    ), (0, _operators.take)(1)(_ref)
  );
});

exports.default = _default;
},{"../types":"types.ts","./utils":"core/utils.ts"}],"core/server.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _path = _interopRequireDefault(require("path"));

var _rxjs = require("rxjs");

var _operators = require("rxjs/operators");

var _localRequire = _interopRequireDefault(require("../utils/localRequire"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let imports;

var _default = options => (0, _operators.switchMap)(val => _rxjs.Observable.create(observer => {
  const {
    port
  } = options;
  if (!imports) imports = (0, _localRequire.default)(['koa', 'koa-static', 'koa-mount'], __filename);
  const app = imports.then(([Koa, serve, mount]) => {
    const app = new Koa();
    const epk = new Koa();
    epk.use(serve(_path.default.resolve(__dirname, '..', 'dist')));
    const tests = new Koa();
    tests.use(serve(_path.default.resolve(process.cwd(), '.epk', 'dist')));
    app.use(mount('/epk', epk));
    app.use(mount('/tests', tests));

    try {
      return app.listen(port);
    } finally {
      observer.next(val);
    }
  });
  return _ => app.then(app => app.close());
}));

exports.default = _default;
},{"../utils/localRequire":"utils/localRequire.ts"}],"core/index.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _rxjs = require("rxjs");

var _operators = require("rxjs/operators");

var _types = require("../types");

var _bundler4 = _interopRequireDefault(require("./bundler"));

var _index = require("../utils/index");

var _targetRuntimeProvider = _interopRequireDefault(require("./target-runtime-provider"));

var _analyze = _interopRequireDefault(require("./analyze"));

var _test = _interopRequireDefault(require("./test"));

var _utils = require("./utils");

var _server = _interopRequireDefault(require("./server"));

var _localRequire = _interopRequireDefault(require("../utils/localRequire"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = _options => {
  var _ref, _ref2, _of;

  // remove undefined values
  Object.keys(_options).forEach(key => _options[key] === undefined && delete _options[key]);
  const target = _options.target || _types.BUNDLER_TARGET.BROWSER;
  const options = {
    browsers: ['chrome'],
    target,
    outDir: `.epk/dist/${target}`,
    watch: true,
    cache: true,
    cacheDir: `.epk/cache/${target}`,
    port: undefined,
    minify: false,
    scopeHoist: false,
    logLevel: 0,
    // 3 = log everything, 2 = log warnings & errors, 1 = log errors
    sourceMaps: true,
    // Enable or disable sourcemaps, defaults to enabled (minified builds currently always create sourcemaps)
    detailedReport: false,
    // apply options
    ..._options
  };

  let _port;

  if (!_utils.isBrowser && options.target === _types.BUNDLER_TARGET.BROWSER) {
    _port = (0, _localRequire.default)('get-port', __filename).then(getPort => getPort({
      port: 10485
    })).then(port => options.port = port);
  } // @ts-ignore


  return _ref = (_ref2 = (_of = (0, _rxjs.of)([(0, _bundler4.default)(options), (!_utils.isBrowser && options.target === _types.BUNDLER_TARGET.BROWSER ? options.browsers : [options.target]).map(target => (0, _targetRuntimeProvider.default)(target, options))]) // @ts-ignore
  , (!_utils.isBrowser && options.target === _types.BUNDLER_TARGET.BROWSER ? (0, _operators.delayWhen)(() => (0, _rxjs.from)(_port)) : (0, _operators.tap)())(_of) // @ts-ignore
  ), (!_utils.isBrowser && options.target === _types.BUNDLER_TARGET.BROWSER ? (0, _server.default)(options) : (0, _operators.tap)())(_ref2) // @ts-ignore
  ), (0, _operators.mergeMap)(([bundler, targetRuntimeProviders]) => {
    var _bundler, _ref3, _ref4, _bundler2;

    return (0, _rxjs.merge)(( // @ts-ignore
    _bundler = bundler // @ts-ignore
    , (0, _operators.filter)(({
      name
    }) => name === 'buildStart')(_bundler)), ( // @ts-ignore
    _ref3 = (_ref4 = (_bundler2 = bundler // @ts-ignore
    , (0, _operators.filter)(({
      name
    }) => name === 'buildStart')(_bundler2) // @ts-ignore
    ), (0, _operators.switchMap)(({
      entryFiles,
      buildStartTime
    }) => {
      var _ref5, _bundler3;

      return (// @ts-ignore
        _ref5 = (_bundler3 = bundler // @ts-ignore
        , (0, _operators.filter)(({
          name
        }) => name === 'bundled')(_bundler3) // @ts-ignore
        ), (0, _operators.map)(bundleContainer => ({ ...bundleContainer,
          entryFiles,
          buildStartTime
        }))(_ref5)
      );
    })(_ref4) // @ts-ignore
    ), (0, _operators.switchMap)(({
      bundle
    }) => {
      var _merge;

      return (// @ts-ignore
        _merge = (0, _rxjs.merge)(...targetRuntimeProviders) // @ts-ignore
        , (0, _operators.mergeMap)((targetRuntimeProvider // @ts-ignore
        ) => {
          var _from;

          return _from = (0, _rxjs.from)((bundle.isEmpty ? Array.from(bundle.childBundles) : [bundle]).map(({
            name: path
          }) => path)) // @ts-ignore
          , (0, _operators.mergeMap)(path => {
            var _of2, _ref6, _newContextObservable, _ref7, _ref8, _analyzedObservable;

            // @ts-ignore
            const newContextObservable = ( // @ts-ignore
            _of2 = (0, _rxjs.of)({
              target: targetRuntimeProvider.target,
              name: bundle.entryAsset.name,
              path,
              url: options.target === _types.BUNDLER_TARGET.BROWSER && (0, _index.transformPathToTestUrl)(path, options.port)
            }) // @ts-ignore
            , (0, _operators.publish)()(_of2)); // @ts-ignore

            const analyzedObservable = ( // @ts-ignore
            _ref6 = (_newContextObservable = newContextObservable // @ts-ignore
            , (0, _analyze.default)(targetRuntimeProvider, options)(_newContextObservable) // @ts-ignore
            ), (0, _operators.publish)()(_ref6)); // @ts-ignore

            const testedObservable = ( // @ts-ignore
            _ref7 = (_ref8 = (_analyzedObservable = analyzedObservable // @ts-ignore
            , (0, _operators.filter)(file => !file.errors.length)(_analyzedObservable) // @ts-ignore
            ), (0, _operators.switchMap)(file => {
              var _from2;

              return (// @ts-ignore
                _from2 = (0, _rxjs.from)(file.tests) // @ts-ignore
                , (0, _test.default)(file, targetRuntimeProvider, options)(_from2)
              );
            })(_ref8) // @ts-ignore
            ), (0, _operators.publish)()(_ref7));
            const testerObservable = (0, _rxjs.merge)(newContextObservable, analyzedObservable, testedObservable);
            testedObservable.connect();
            analyzedObservable.connect();
            newContextObservable.connect();
            return testerObservable;
          })(_from);
        })(_merge)
      );
    })(_ref3)));
  })(_ref);
};

exports.default = _default;
},{"../types":"types.ts","./bundler":"core/bundler.ts","../utils/index":"utils/index.ts","./target-runtime-provider":"core/target-runtime-provider.ts","./analyze":"core/analyze.ts","./test":"core/test.ts","./utils":"core/utils.ts","./server":"core/server.ts","../utils/localRequire":"utils/localRequire.ts"}],"test/error.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.errors = void 0;

var _utils = require("../core/utils");

const errors = [];
exports.errors = errors;

if (_utils.isBrowser) {
  window.addEventListener('error', err => errors.push(err));
} else {
  process.on('uncaughtException', err => errors.push(err));
}
},{"../core/utils":"core/utils.ts"}],"test/test.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.test = exports.fail = exports.pass = exports.todo = exports.tests = void 0;

var _events = require("events");

var _cjs = require("flatted/cjs");

var _utils = require("../core/utils");

var _types = require("../types");

var _error = require("./error");

var _rxjs = require("rxjs");

const tests = new Map();
exports.tests = tests;

const todo = _ => {};

exports.todo = todo;

const pass = _ => {};

exports.pass = pass;

const fail = _ => {};

exports.fail = fail;

const test = (desc, func) => {
  if (typeof desc !== 'string') throw new Error('desc has to be a string');
  if (typeof func !== 'function') throw new Error('func has to be a function');
  if (tests.has(desc)) throw new Error(`Found duplicate test description: ${desc}`);
  tests.set(desc, func);
};

exports.test = test;
const initiated = new Promise(resolve => setTimeout(resolve, 0));

const emit = (type, data) => _utils.isBrowser ? window.parent.postMessage({
  type,
  errors: _error.errors,
  data
}, '*') : global[_types.NODE_GLOBAL].emit('message', {
  type,
  errors: _error.errors,
  data
});

const getTests = () => emit(_types.MESSAGE_TYPE.GET_TESTS_RESPONSE, Array.from(tests).map(([description, func]) => ({
  description,
  body: func.toString()
})));

const runTest = async description => {
  // todo: replace by "isBrowser ? window : require('perf_hooks')"
  const {
    performance
  } = window;
  let timeStart, timeEnd, value, error;

  try {
    timeStart = performance.now();
    value = await tests.get(description)();
  } catch (err) {
    error = err;
  } finally {
    timeEnd = performance.now();
  }

  emit(_types.MESSAGE_TYPE.RUN_TEST_RESPONSE, {
    timeStart,
    timeEnd,
    type: (0, _rxjs.isObservable)(value) ? 'observable' : value instanceof Promise ? 'promise' : 'function',
    value: (0, _cjs.stringify)(value),
    error: error && {
      name: error.name,
      message: error.message
    }
  });
};

const newEvent = ({
  data: {
    type,
    description
  }
}) => type === _types.MESSAGE_TYPE.GET_TESTS ? getTests() : type === _types.MESSAGE_TYPE.RUN_TEST && runTest(description);

if (_utils.isBrowser) {
  window.addEventListener('message', newEvent);
} else {
  const events = global[_types.NODE_GLOBAL] = new _events.EventEmitter();
  events.addListener('message', newEvent);
} // const addEventListener =
//   isBrowser
//     ? window.addEventListener
//     : global[NODE_GLOBAL].addListener
// addEventListener('message', ({ data: { type, description } }) =>
//     type === MESSAGE_TYPE.GET_TESTS ? getTests()
//   : type === MESSAGE_TYPE.RUN_TEST && runTest(description))
},{"../core/utils":"core/utils.ts","../types":"types.ts","./error":"test/error.ts"}],"test/assert.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.assert = void 0;

var _powerAssert = _interopRequireDefault(require("power-assert"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const assert = _powerAssert.default.customize({});

exports.assert = assert;
},{}],"test/index.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "test", {
  enumerable: true,
  get: function () {
    return _test.test;
  }
});
Object.defineProperty(exports, "assert", {
  enumerable: true,
  get: function () {
    return _assert.assert;
  }
});

var _test = require("./test");

var _assert = require("./assert");
},{"./test":"test/test.ts","./assert":"test/assert.ts"}],"../node_modules/parcel-bundler/src/builtins/bundle-url.js":[function(require,module,exports) {
var bundleURL = null;

function getBundleURLCached() {
  if (!bundleURL) {
    bundleURL = getBundleURL();
  }

  return bundleURL;
}

function getBundleURL() {
  // Attempt to find the URL of the current script and use that as the base URL
  try {
    throw new Error();
  } catch (err) {
    var matches = ('' + err.stack).match(/(https?|file|ftp):\/\/[^)\n]+/g);

    if (matches) {
      return getBaseURL(matches[0]);
    }
  }

  return '/';
}

function getBaseURL(url) {
  return ('' + url).replace(/^((?:https?|file|ftp):\/\/.+)\/[^/]+$/, '$1') + '/';
}

exports.getBundleURL = getBundleURLCached;
exports.getBaseURL = getBaseURL;
},{}],"../node_modules/parcel-bundler/src/builtins/bundle-loader.js":[function(require,module,exports) {
var getBundleURL = require('./bundle-url').getBundleURL;

function loadBundlesLazy(bundles) {
  if (!Array.isArray(bundles)) {
    bundles = [bundles];
  }

  var id = bundles[bundles.length - 1];

  try {
    return Promise.resolve(require(id));
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      return new LazyPromise(function (resolve, reject) {
        loadBundles(bundles.slice(0, -1)).then(function () {
          return require(id);
        }).then(resolve, reject);
      });
    }

    throw err;
  }
}

function loadBundles(bundles) {
  return Promise.all(bundles.map(loadBundle));
}

var bundleLoaders = {};

function registerBundleLoader(type, loader) {
  bundleLoaders[type] = loader;
}

module.exports = exports = loadBundlesLazy;
exports.load = loadBundles;
exports.register = registerBundleLoader;
var bundles = {};

function loadBundle(bundle) {
  var id;

  if (Array.isArray(bundle)) {
    id = bundle[1];
    bundle = bundle[0];
  }

  if (bundles[bundle]) {
    return bundles[bundle];
  }

  var type = (bundle.substring(bundle.lastIndexOf('.') + 1, bundle.length) || bundle).toLowerCase();
  var bundleLoader = bundleLoaders[type];

  if (bundleLoader) {
    return bundles[bundle] = bundleLoader(getBundleURL() + bundle).then(function (resolved) {
      if (resolved) {
        module.bundle.register(id, resolved);
      }

      return resolved;
    }).catch(function (e) {
      delete bundles[bundle];
      throw e;
    });
  }
}

function LazyPromise(executor) {
  this.executor = executor;
  this.promise = null;
}

LazyPromise.prototype.then = function (onSuccess, onError) {
  if (this.promise === null) this.promise = new Promise(this.executor);
  return this.promise.then(onSuccess, onError);
};

LazyPromise.prototype.catch = function (onError) {
  if (this.promise === null) this.promise = new Promise(this.executor);
  return this.promise.catch(onError);
};
},{"./bundle-url":"../node_modules/parcel-bundler/src/builtins/bundle-url.js"}],"index.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _index = require("./core/index");

Object.keys(_index).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _index[key];
    }
  });
});

var _index2 = require("./test/index");

Object.keys(_index2).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _index2[key];
    }
  });
});
if (!module.parent) require("_bundle_loader")(require.resolve('./cli/index')).then(() => {}); // keep the then because else, the code isn't executed
},{"./core/index":"core/index.ts","./test/index":"test/index.ts","_bundle_loader":"../node_modules/parcel-bundler/src/builtins/bundle-loader.js","./cli/index":[["cli.48478702.js","cli/index.ts"],"cli.48478702.map","cli/index.ts"]}],"../node_modules/parcel-bundler/src/builtins/loaders/node/js-loader.js":[function(require,module,exports) {
var fs = require('fs');

module.exports = function loadJSBundle(bundle) {
  return new Promise(function (resolve, reject) {
    fs.readFile(__dirname + bundle, 'utf8', function (err, data) {
      if (err) {
        reject(err);
      } else {
        // wait for the next event loop iteration, so we are sure
        // the current module is fully loaded
        setImmediate(function () {
          resolve(data);
        });
      }
    });
  }).then(function (code) {
    new Function('', code)();
  });
};
},{}],0:[function(require,module,exports) {
var b=require("../node_modules/parcel-bundler/src/builtins/bundle-loader.js");b.register("js",require("../node_modules/parcel-bundler/src/builtins/loaders/node/js-loader.js"));
},{}]},{},[0,"index.ts"], null)
//# sourceMappingURL=index.map