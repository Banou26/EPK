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
})({"cli/index.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _commander = _interopRequireDefault(require("commander"));

var _chalk = _interopRequireDefault(require("chalk"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const helpMessage = `
Run \`${_chalk.default.bold('epk help <command>')}\` for more information on specific commands
`;

var _default = () => new Promise((resolve, reject) => {
  _commander.default.command('serve [input...]').description('starts a development server').action(resolve);

  _commander.default.command('help [command]').description('display help information for a command').action(command => (_commander.default.commands.find(c => c.name() === command) || _commander.default).help());

  _commander.default.on('--help', _ => console.log(helpMessage)); // Make serve the default command except for --help


  const args = process.argv;
  if (args[2] === '--help' || args[2] === '-h') args[2] = 'help';

  if (!args[2] || !_commander.default.commands.some(c => c.name() === args[2])) {
    args.splice(2, 0, 'serve');
  }

  _commander.default.parse(args);
});

exports.default = _default;
},{}],"runner/bundler.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _path = _interopRequireDefault(require("path"));

var _parcelBundler = _interopRequireDefault(require("parcel-bundler"));

var _rxjs = require("rxjs");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = options => {
  const observable = _rxjs.Observable.create(observer => {
    const bundler = new _parcelBundler.default(options.entryFiles, {
      outDir: '.epk/dist',
      watch: true,
      cache: true,
      cacheDir: '.epk/cache',
      minify: false,
      scopeHoist: false,
      hmr: false,
      target: 'browser',
      logLevel: 0,
      // 3 = log everything, 2 = log warnings & errors, 1 = log errors
      sourceMaps: true,
      // Enable or disable sourcemaps, defaults to enabled (minified builds currently always create sourcemaps)
      detailedReport: false
    });
    bundler.addAssetType('js', _path.default.resolve(__dirname, '../src/runner/js-asset.ts'));
    bundler.addAssetType('ts', _path.default.resolve(__dirname, '../src/runner/ts-asset.ts'));
    bundler.on('bundled', bundle => observer.next({
      options,
      bundler: observable,
      name: 'bundled',
      bundle,
      buildEndTime: Date.now()
    }));
    bundler.on('buildStart', entryFiles => observer.next({
      options,
      bundler: observable,
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

  return observable;
};

exports.default = _default;
},{}],"cli/logger.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _chalk = _interopRequireDefault(require("chalk"));

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
  color = _chalk.default.supportsColor,
  emojis = defaultEmojis,
  chalk = new _chalk.default.constructor({
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
},{}],"api/utils.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.callPageFunction = exports.prettifyTime = exports.transformPathToUrl = exports.prettifyPath = void 0;

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const prettifyPath = path => _path.default.relative(process.cwd(), path);

exports.prettifyPath = prettifyPath;

const transformPathToUrl = path => path.replace(`${_path.default.resolve(process.cwd(), '.epk', 'dist')}\\`, '/tests/');

exports.transformPathToUrl = transformPathToUrl;

const prettifyTime = time => time < 1000 ? `${time.toFixed()}ms` : `${(time / 1000).toFixed(2)}s`;

exports.prettifyTime = prettifyTime;

const callPageFunction = (page, type, ...payload) => page.evaluate(({
  type,
  payload
}) => window[type](...payload), {
  type,
  payload
});

exports.callPageFunction = callPageFunction;
},{}],"types.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MESSAGE_TYPE = exports.BROWSER = void 0;
// import { Observable } from "rxjs"
let BROWSER;
exports.BROWSER = BROWSER;

(function (BROWSER) {
  BROWSER["CHROME"] = "Chrome";
  BROWSER["CHROME_CANARY"] = "ChromeCanary";
  BROWSER["FIREFOX"] = "Firefox";
  BROWSER["FIREFOX_NIGHTLY"] = "FirefoxNightly";
})(BROWSER || (exports.BROWSER = BROWSER = {}));

let MESSAGE_TYPE;
exports.MESSAGE_TYPE = MESSAGE_TYPE;

(function (MESSAGE_TYPE) {
  MESSAGE_TYPE["GET_TESTS"] = "__EPK_GET_TESTS";
  MESSAGE_TYPE["RUN_TESTS"] = "__EPK_RUN_TESTS";
  MESSAGE_TYPE["RUN_TEST"] = "__EPK_RUN_TEST";
})(MESSAGE_TYPE || (exports.MESSAGE_TYPE = MESSAGE_TYPE = {}));
},{}],"api/server.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.port = void 0;

var _path = _interopRequireDefault(require("path"));

var _koa = _interopRequireDefault(require("koa"));

var _koaStatic = _interopRequireDefault(require("koa-static"));

var _koaMount = _interopRequireDefault(require("koa-mount"));

var _getPort = _interopRequireDefault(require("get-port"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const port = (0, _getPort.default)({
  port: 10485
});
exports.port = port;
const app = new _koa.default();
const epk = new _koa.default();
epk.use((0, _koaStatic.default)(_path.default.resolve(__dirname, '..', 'dist')));
const tests = new _koa.default();
tests.use((0, _koaStatic.default)(_path.default.resolve(process.cwd(), '.epk', 'dist')));
app.use((0, _koaMount.default)('/epk', epk));
app.use((0, _koaMount.default)('/tests', tests));
port.then(port => app.listen(port));
},{}],"api/page-provider.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _puppeteer = _interopRequireDefault(require("puppeteer"));

var _rxjs = require("rxjs");

var _types = require("../types");

var _server = require("./server");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const getChrome = () => _puppeteer.default.launch({
  devtools: true
});

const getFirefox = () => _puppeteer.default.launch({
  devtools: false
});

const browsers = {
  [_types.BROWSER.CHROME]: getChrome,
  [_types.BROWSER.CHROME_CANARY]: getChrome,
  [_types.BROWSER.FIREFOX]: getFirefox,
  [_types.BROWSER.FIREFOX_NIGHTLY]: getFirefox
};

const getBrowsers = async browserList => (await Promise.all(browserList.map(browser => browsers[browser]()))).reduce((o, v, k) => (o[browserList[k]] = v, o), {});

var _default = async options => {
  const browsers = await getBrowsers(options.browsers);
  return {
    [_types.BROWSER.CHROME]: _rxjs.Observable.create(observer => {
      let page;

      (async () => {
        observer.next(page = await browsers[_types.BROWSER.CHROME].newPage());
        await page.goto(`http://localhost:${await _server.port}/epk/browser-runner.html`);
      })();

      return async _ => (await page).close();
    }),
    [_types.BROWSER.FIREFOX]: _rxjs.Observable.create(observer => {
      let page;

      (async () => {
        observer.next(page = await browsers[_types.BROWSER.FIREFOX].newPage());
        await page.goto(`http://localhost:${await _server.port}/epk/browser-runner.html`);
      })();

      return async _ => (await page).close();
    })
  };
};

exports.default = _default;
},{"../types":"types.ts","./server":"api/server.ts"}],"api/analyze.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _operators = require("rxjs/operators");

var _rxjs = require("rxjs");

var _types = require("../types");

var _utils = require("./utils");

const analyzeChrome = (page, url) => (0, _utils.callPageFunction)(page, _types.MESSAGE_TYPE.GET_TESTS, url);

const analyzeFirefox = (page, url) => (0, _utils.callPageFunction)(page, _types.MESSAGE_TYPE.GET_TESTS, url);

const analyzes = {
  [_types.BROWSER.CHROME]: analyzeChrome,
  [_types.BROWSER.FIREFOX]: analyzeFirefox
};

var _default = (0, _operators.switchMap)(ctx => (0, _rxjs.merge)(...ctx.browsers.map(browser => ctx.files.map(({
  url
} // @ts-ignore
) => {
  var _ctx$pageProvider$bro;

  return _ctx$pageProvider$bro = ctx.pageProvider[browser], // @ts-ignore
  (0, _operators.switchMap)(page => _rxjs.Observable.create(observer => {
    analyzes[browser](page, url).then(res => {
      observer.next({
        res,
        browser,
        url
      });
    });
    return _ => {};
  }))(_ctx$pageProvider$bro);
})).flat()));

exports.default = _default;
},{"../types":"types.ts","./utils":"api/utils.ts"}],"api/index.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _chalk = _interopRequireDefault(require("chalk"));

var _operators = require("rxjs/operators");

var _bundler2 = _interopRequireDefault(require("../runner/bundler"));

var _logger = _interopRequireDefault(require("../cli/logger"));

var _utils = require("./utils");

var _pageProvider = _interopRequireDefault(require("./page-provider"));

var _analyze = _interopRequireDefault(require("./analyze"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = (options // @ts-ignore
) => {
  var _ref, _ref2, _Bundler;

  return _ref = (_ref2 = (_Bundler = (0, _bundler2.default)(options) // @ts-ignore
  , (0, _operators.filter)(({
    name
  }) => name === 'buildStart')(_Bundler) // @ts-ignore
  ), (0, _operators.tap)(({
    entryFiles
  }) => {
    _logger.default.clear();

    _logger.default.progress(`\n${_chalk.default.grey(`Building ${entryFiles.map(_utils.prettifyPath).join(', ')}`)}`);
  })(_ref2) // @ts-ignore
  ), (0, _operators.switchMap)(({
    bundler,
    entryFiles,
    buildStartTime
  }) => {
    var _ref3, _ref4, _ref5, _ref6, _bundler;

    const files = entryFiles.map(path => ({
      path,
      url: (0, _utils.transformPathToUrl)(path)
    })); // @ts-ignore

    return _ref3 = (_ref4 = (_ref5 = (_ref6 = (_bundler = bundler // @ts-ignore
    , (0, _operators.filter)(({
      name
    }) => name === 'bundled')(_bundler) // @ts-ignore
    ), (0, _operators.mergeMap)(async ctx => ({ ...ctx,
      pageProvider: await (0, _pageProvider.default)(options)
    }))(_ref6) // @ts-ignore
    ), (0, _operators.map)(ctx => ({ ...ctx,
      browsers: options.browsers,
      files,
      entryFiles,
      buildStartTime
    }))(_ref5) // @ts-ignore
    ), (0, _analyze.default)(_ref4) // @ts-ignore
    ), (0, _operators.tap)(res => _logger.default.progress(`${res}`))(_ref3);
  })(_ref);
};

exports.default = _default;
},{"../runner/bundler":"runner/bundler.ts","../cli/logger":"cli/logger.ts","./utils":"api/utils.ts","./page-provider":"api/page-provider.ts","./analyze":"api/analyze.ts"}],"utils.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isBrowser = void 0;
const isBrowser = typeof window !== 'undefined';
exports.isBrowser = isBrowser;
},{}],"test/error.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.errors = void 0;

var _utils = require("../utils");

const errors = [];
exports.errors = errors;

if (_utils.isBrowser) {
  window.addEventListener('error', err => errors.push(err));
} else {
  process.on('uncaughtException', err => errors.push(err));
}
},{"../utils":"utils.ts"}],"test/test.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.test = exports.fail = exports.pass = exports.todo = exports.tests = void 0;

var _utils = require("../utils");

var _error = require("./error");

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

if (_utils.isBrowser) {
  window.addEventListener('message', async ({
    data: {
      name,
      data
    }
  }) => {
    if (name === _utils.GET_TESTS) {
      window.parent.postMessage({
        name: _utils.GET_TESTS,
        errors: _error.errors,
        data: Array.from(tests).map(([desc, func]) => [desc, func.toString()])
      }, '*');
    } else if (name === _utils.RUN_TEST) {
      let error;

      try {
        const result = await tests.get(data)(); // console.log(result)
        // if (result instanceof Error) error = result
      } catch (err) {
        // console.log(err)
        error = err;
      } //   .then(result => console.log('result', result)).catch(err => console.log('error', err))
      // setTimeout(_ => console.log(errors), 0)


      window.parent.postMessage({
        name: _utils.GET_TESTS,
        data: {
          error // ...await tests.get(data)()
          //   .then(value => ({ /*value*/ }))
          //   .catch(error => console.log('lol', error) || ({ error }))

        }
      }, '*');
    }
  });
}
},{"../utils":"utils.ts","./error":"test/error.ts"}],"test/assert.ts":[function(require,module,exports) {
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
},{"./test":"test/test.ts","./assert":"test/assert.ts"}],"index.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fastGlob = _interopRequireDefault(require("fast-glob"));

var _path = _interopRequireDefault(require("path"));

var _index = _interopRequireDefault(require("./cli/index"));

var _index2 = _interopRequireWildcard(require("./api/index"));

Object.keys(_index2).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _index2[key];
    }
  });
});

var _types = require("./types");

var _logger = _interopRequireDefault(require("./cli/logger"));

var _index3 = require("./test/index");

Object.keys(_index3).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _index3[key];
    }
  });
});

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

if (!module.parent) {
  // Run via CLI
  (0, _index.default)().then(async globs => (0, _index2.default)({
    browsers: [_types.BROWSER.CHROME],
    entryFiles: (await _fastGlob.default.async(globs)).map(path => _path.default.join(process.cwd(), path)) // @ts-ignore

  }).subscribe(_ => {}, err => {
    _logger.default.error(err);
  }));
}
},{"./cli/index":"cli/index.ts","./api/index":"api/index.ts","./types":"types.ts","./cli/logger":"cli/logger.ts","./test/index":"test/index.ts"}]},{},["index.ts"], null)
//# sourceMappingURL=index.map