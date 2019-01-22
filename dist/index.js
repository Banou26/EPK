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
})({"runner/cli.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _commander = _interopRequireDefault(require("commander"));

var _chalk = _interopRequireDefault(require("chalk"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = () => new Promise((resolve, reject) => {
  _commander.default.command('serve [input...]').description('starts a development server').action(resolve);

  _commander.default.command('help [command]').description('display help information for a command').action(function (command) {
    let cmd = _commander.default.commands.find(c => c.name() === command) || _commander.default;

    cmd.help();
  });

  _commander.default.on('--help', function () {
    console.log('');
    console.log('  Run `' + _chalk.default.bold('epk help <command>') + '` for more information on specific commands');
    console.log('');
  }); // Make serve the default command except for --help


  const args = process.argv;
  if (args[2] === '--help' || args[2] === '-h') args[2] = 'help';

  if (!args[2] || !_commander.default.commands.some(c => c.name() === args[2])) {
    args.splice(2, 0, 'serve');
  }

  _commander.default.parse(args);
});

exports.default = _default;
},{}],"runner/utils.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.prettifyTime = exports.prettifyPath = void 0;

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const prettifyPath = path => _path.default.relative(process.cwd(), path);

exports.prettifyPath = prettifyPath;

const prettifyTime = time => time < 1000 ? `${time.toFixed()}ms` : `${(time / 1000).toFixed(2)}s`;

exports.prettifyTime = prettifyTime;
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

var _default = entryFiles => {
  const observable = _rxjs.Observable.create(observer => {
    const bundler = new _parcelBundler.default(entryFiles, {
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
      name: 'bundled',
      bundle,
      bundledTime: Date.now()
    }));
    bundler.on('buildStart', entryPoints => observer.next({
      bundler: observable,
      name: 'buildStart',
      entryPoints,
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
},{}],"runner/logger.ts":[function(require,module,exports) {
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

// https://github.com/parcel-bundler/parcel/tree/master/packages/core/logger/src
const prettyError = (err, opts = {}) => {
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
    stack = opts.color && err.highlightedCodeFrame || err.codeFrame;
  } else if (err.stack) {
    stack = err.stack.slice(err.stack.indexOf('\n') + 1);
  }

  return {
    message,
    stack
  };
};

const supportsEmoji = process.platform !== 'win32' || process.env.TERM === 'xterm-256color'; // Fallback symbols for Windows from https://en.wikipedia.org/wiki/Code_page_437

const emoji = {
  progress: supportsEmoji ? '⏳' : '∞',
  success: supportsEmoji ? '✨' : '√',
  error: supportsEmoji ? '🚨' : '×',
  warning: supportsEmoji ? '⚠️' : '‼'
};

class Logger {
  constructor(options) {
    this.lines = 0;
    this.spinner = null;
    this.setOptions(options);
  }

  setOptions(options) {
    this.logLevel = options && isNaN(options.logLevel) === false ? Number(options.logLevel) : 3;
    this.color = options && typeof options.color === 'boolean' ? options.color : _chalk.default.supportsColor;
    this.emoji = options && options.emoji || emoji;
    this.chalk = new _chalk.default.constructor({
      enabled: this.color
    });
    this.isTest = options && typeof options.isTest === 'boolean' ? options.isTest : process.env.NODE_ENV === 'test';
  }

  countLines(message) {
    return (0, _stripAnsi.default)(message).split('\n').reduce((p, line) => {
      if (process.stdout.columns) {
        return p + Math.ceil((line.length || 1) / process.stdout.columns);
      }

      return p + 1;
    }, 0);
  }

  writeRaw(message) {
    this.stopSpinner();
    this.lines += this.countLines(message) - 1;
    process.stdout.write(message);
  }

  write(message, persistent = false) {
    if (this.logLevel > 3) {
      return this.verbose(message);
    }

    if (!persistent) {
      this.lines += this.countLines(message);
    }

    this.stopSpinner();

    this._log(message);
  }

  verbose(message) {
    if (this.logLevel < 4) {
      return;
    }

    let currDate = new Date();
    message = `[${currDate.toLocaleTimeString()}]: ${message}`;

    if (this.logLevel > 4) {
      if (!this.logFile) {
        this.logFile = _fs.default.createWriteStream(_path.default.join(process.cwd(), `parcel-debug-${currDate.toISOString()}.log`));
      }

      this.logFile.write((0, _stripAnsi.default)(message) + '\n');
    }

    this._log(message);
  }

  log(message) {
    if (this.logLevel < 3) {
      return;
    }

    this.write(message);
  }

  persistent(message) {
    if (this.logLevel < 3) {
      return;
    }

    this.write(this.chalk.bold(message), true);
  }

  warn(err) {
    if (this.logLevel < 2) {
      return;
    }

    this._writeError(err, this.emoji.warning, this.chalk.yellow);
  }

  error(err) {
    if (this.logLevel < 1) {
      return;
    }

    this._writeError(err, this.emoji.error, this.chalk.red.bold);
  }

  success(message) {
    this.log(`${this.emoji.success}  ${this.chalk.green.bold(message)}`);
  }

  formatError(err, opts) {
    return prettyError(err, opts);
  }

  _writeError(err, emoji, color) {
    let {
      message,
      stack
    } = this.formatError(err, {
      color: this.color
    });
    this.write(color(`${emoji}  ${message}`));

    if (stack) {
      this.write(stack);
    }
  }

  clear() {
    if (!this.color || this.isTest || this.logLevel > 3) {
      return;
    }

    while (this.lines > 0) {
      _readline.default.clearLine(process.stdout, 0);

      _readline.default.moveCursor(process.stdout, 0, -1);

      this.lines--;
    }

    _readline.default.cursorTo(process.stdout, 0);

    this.stopSpinner();
  }

  progress(message) {
    if (this.logLevel < 3) {
      return;
    }

    if (this.logLevel > 3) {
      return this.verbose(message);
    }

    let styledMessage = this.chalk.gray.bold(message);

    if (!this.spinner) {
      this.spinner = (0, _ora.default)({
        text: styledMessage,
        stream: process.stdout,
        enabled: this.isTest ? false : undefined // fall back to ora default unless we need to explicitly disable it.

      }).start();
    } else {
      this.spinner.text = styledMessage;
    }
  }

  stopSpinner() {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }

  handleMessage(options) {
    this[options.method](...options.args);
  }

  _log(message) {
    // eslint-disable-next-line no-console
    console.log(message);
  }

  table(columns, table) {
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
      let items = row.map((item, i) => {
        // Add padding between columns unless the alignment is the opposite to the
        // next column and pad to the column width.
        let padding = !columns[i + 1] || columns[i + 1].align === columns[i].align ? 4 : 0;
        return pad(item, colWidths[i] + padding, columns[i].align);
      });
      this.log(items.join(''));
    }
  }

} // Pad a string with spaces on either side


function pad(text, length, align = 'left') {
  let pad = ' '.repeat(length - stringWidth(text));

  if (align === 'right') {
    return pad + text;
  }

  return text + pad;
} // Count visible characters in a string


function stringWidth(string) {
  return (0, _graphemeBreaker.countBreaks)((0, _stripAnsi.default)('' + string));
}

var _default = new Logger();

exports.default = _default;
},{}],"runner/server.ts":[function(require,module,exports) {
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
tests.use((0, _koaStatic.default)(_path.default.resolve(__dirname, '..', '.epk', 'dist')));
app.use((0, _koaMount.default)('/epk', epk));
app.use((0, _koaMount.default)('/tests', tests));
port.then(port => app.listen(port));
},{}],"utils.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RUN_TEST = exports.RUN_TESTS = exports.GET_TESTS = exports.isBrowser = void 0;
const isBrowser = typeof window !== 'undefined';
exports.isBrowser = isBrowser;
const GET_TESTS = '__EPK_GET_TESTS';
exports.GET_TESTS = GET_TESTS;
const RUN_TESTS = '__EPK_RUN_TESTS';
exports.RUN_TESTS = RUN_TESTS;
const RUN_TEST = '__EPK_RUN_TEST';
exports.RUN_TEST = RUN_TEST;
},{}],"runner/analyze.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.browser = void 0;

var _path = _interopRequireDefault(require("path"));

var _chalk = _interopRequireDefault(require("chalk"));

var _rxjs = require("rxjs");

var _operators = require("rxjs/operators");

var _utils = require("./utils");

var _utils2 = require("../utils");

var _logger = _interopRequireDefault(require("./logger"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const browser = // @ts-ignore
(0, _operators.switchMap)(async ctx => {
  const {
    bundle,
    page
  } = ctx;
  const tests = await page.evaluate(({
    GET_TESTS,
    urls
  }) => window[GET_TESTS](urls), {
    GET_TESTS: _utils2.GET_TESTS,
    urls: (bundle.isEmpty ? Array.from(bundle.childBundles) : [bundle]).map(({
      name: distPath,
      entryAsset: {
        name: sourcePath
      }
    }) => ({
      sourcePath,
      distPath,
      url: distPath.replace(`${_path.default.resolve(process.cwd(), '.epk', 'dist')}\\`, '/tests/')
    }))
  });
  return {
    tests,
    ...ctx
  };
});
exports.browser = browser;

var _default = (0, _operators.switchMap)(val => {
  var _ref, _ref2, _of;

  return (// @ts-ignore
    _ref = (_ref2 = (_of = (0, _rxjs.of)(val) // @ts-ignore
    , (0, _operators.tap)(({
      entryPoints,
      bundledTime,
      buildStartTime
    }) => {
      _logger.default.progress(`\n${_chalk.default.green(`Built in ${(0, _utils.prettifyTime)(bundledTime - buildStartTime)}.`)}\n${_chalk.default.grey(`Analyzing ${entryPoints.map(_utils.prettifyPath).join(', ')}`)}.`);
    })(_of) // @ts-ignore
    ), (0, _operators.tap)(ctx => ctx.analyzeStartTime = Date.now())(_ref2) // @ts-ignore
    ), browser(_ref)
  );
});

exports.default = _default;
},{"./utils":"runner/utils.ts","../utils":"utils.ts","./logger":"runner/logger.ts"}],"runner/test.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.browser = void 0;

var _chalk = _interopRequireDefault(require("chalk"));

var _operators = require("rxjs/operators");

var _utils = require("./utils");

var _utils2 = require("../utils");

var _rxjs = require("rxjs");

var _logger = _interopRequireDefault(require("./logger"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const browser = // @ts-ignore
(0, _operators.switchMap)(async ctx => {
  const {
    page,
    bundle,
    tests
  } = ctx;
  await page.coverage.startJSCoverage();
  const testsResult = await page.evaluate(({
    RUN_TESTS,
    tests
  }) => window[RUN_TESTS](tests), {
    RUN_TESTS: _utils2.RUN_TESTS,
    tests
  });
  return {
    testsResult,
    testsCoverage: await page.coverage.stopJSCoverage(),
    ...ctx
  };
});
exports.browser = browser;

var _default = (0, _operators.switchMap)(val => {
  var _ref, _of;

  return (// @ts-ignore
    _ref = (_of = (0, _rxjs.of)(val) // @ts-ignore
    , (0, _operators.tap)(ctx => {
      ctx.analyzeEndTime = Date.now();
      ctx.testStartTime = Date.now();
      const {
        entryPoints,
        buildStartTime,
        bundledTime,
        analyzeEndTime,
        analyzeStartTime
      } = ctx;

      _logger.default.progress(`\n${_chalk.default.green(`Built in ${(0, _utils.prettifyTime)(bundledTime - buildStartTime)}.`)}\n${_chalk.default.green(`Analyzed in ${(0, _utils.prettifyTime)(analyzeEndTime - analyzeStartTime)}.`)}\n${_chalk.default.green(`Testing ${entryPoints.map(_utils.prettifyPath).join(', ')}.`)}`);
    })(_of) // @ts-ignore
    ), browser(_ref)
  );
});

exports.default = _default;
},{"./utils":"runner/utils.ts","../utils":"utils.ts","./logger":"runner/logger.ts"}],"runner/post-analyze.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _chalk = _interopRequireDefault(require("chalk"));

var _operators = require("rxjs/operators");

var _rxjs = require("rxjs");

var _utils = require("./utils");

var _logger = _interopRequireDefault(require("./logger"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const formatTest = ({
  description,
  error: {
    message
  }
}) => `\
 ${description}
 ${_chalk.default.gray(message.split('\n').shift().trim())}

${_chalk.default.red(message.split('\n').splice(2).join('\n'))}`;

const formatTests = tests => `\
${_chalk.default.underline((0, _utils.prettifyPath)(tests[0].sourcePath))}

${tests.map(formatTest).join('\n')}`;

const format = (buildTime, analyzeTime, testTime, groupedTests) => `
${_chalk.default.green(`Built in ${buildTime}.`)}
${_chalk.default.green(`Analyzed in ${analyzeTime}.`)}
${_chalk.default.green(`Tested in ${testTime}.`)}
${_chalk.default.reset.red(`Errors:`)}

${_chalk.default.reset(groupedTests.map(([sourcePath, tests]) => [sourcePath, tests.filter(test => test.error)]).map(([, tests]) => formatTests(tests)).join('\n'))}`;

var _default = (0, _operators.switchMap)(val => {
  var _of;

  return _of = (0, _rxjs.of)(val), (0, _operators.tap)(ctx => {
    var _format;

    ctx.testEndTime = Date.now();
    const {
      entryPoints,
      buildStartTime,
      bundledTime,
      analyzeEndTime,
      analyzeStartTime,
      testStartTime,
      testEndTime,
      testsResult
    } = ctx;
    _format = format((0, _utils.prettifyTime)(bundledTime - buildStartTime), (0, _utils.prettifyTime)(analyzeEndTime - analyzeStartTime), (0, _utils.prettifyTime)(testEndTime - testStartTime), Object.entries(testsResult.reduce((obj, test) => (obj[test.sourcePath] ? obj[test.sourcePath].push(test) : obj[test.sourcePath] = [test], obj), {}))), _logger.default.success(_format);
  })(_of);
});

exports.default = _default;
},{"./utils":"runner/utils.ts","./logger":"runner/logger.ts"}],"runner/index.ts":[function(require,module,exports) {
"use strict";

var _path = _interopRequireDefault(require("path"));

var _chalk = _interopRequireDefault(require("chalk"));

var _fastGlob = _interopRequireDefault(require("fast-glob"));

var _operators = require("rxjs/operators");

var _puppeteer = _interopRequireDefault(require("puppeteer"));

var _cli = _interopRequireDefault(require("./cli"));

var _utils = require("./utils");

var _bundler2 = _interopRequireDefault(require("./bundler"));

var _logger = _interopRequireDefault(require("./logger"));

var _server = require("./server");

var _analyze = _interopRequireDefault(require("./analyze"));

var _test = _interopRequireDefault(require("./test"));

var _postAnalyze = _interopRequireDefault(require("./post-analyze"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const init = async ({
  node = false
} = {}) => {
  var _ref, _ref2, _Bundler;

  _logger.default.progress(`\n${_chalk.default.grey(`Preparing the environment.`)}`);

  const globs = await (0, _cli.default)();
  const browser = await _puppeteer.default.launch({
    devtools: true
  });
  const page = !node && (await browser.pages())[0];
  page.on('console', msg => _logger.default.log(`browser: ${msg.text()}`));
  await page.goto(`http://localhost:${await _server.port}/epk/browser-runner.html`);
  const entryFiles = (await _fastGlob.default.async(globs)).map(path => _path.default.join(process.cwd(), path));
  return _ref = (_ref2 = (_Bundler = (0, _bundler2.default)(entryFiles) // @ts-ignore
  , (0, _operators.filter)(({
    name
  }) => name === 'buildStart')(_Bundler) // @ts-ignore
  ), (0, _operators.tap)(_ => {
    _logger.default.clear();

    _logger.default.progress(`\n${_chalk.default.grey(`Building ${entryFiles.map(_utils.prettifyPath).join(', ')}`)}`);
  })(_ref2) // @ts-ignore
  ), (0, _operators.switchMap)(({
    bundler,
    entryPoints,
    buildStartTime
  }) => {
    var _ref3, _ref4, _ref5, _ref6, _bundler;

    return (// @ts-ignore
      _ref3 = (_ref4 = (_ref5 = (_ref6 = (_bundler = bundler // @ts-ignore
      , (0, _operators.filter)(({
        name
      }) => name === 'bundled')(_bundler) // @ts-ignore
      ), (0, _operators.switchMap)(async ctx => {
        await page.reload();
        return {
          bundler,
          entryPoints,
          page,
          buildStartTime,
          ...ctx
        };
      })(_ref6) // @ts-ignore
      ), (0, _analyze.default)(_ref5) // @ts-ignore
      ), (0, _test.default)(_ref4) // @ts-ignore
      ), (0, _postAnalyze.default)(_ref3)
    );
  })(_ref);
};

if (!module.parent) {
  init().then(obs => obs.subscribe(_ => {}));
}
},{"./cli":"runner/cli.ts","./utils":"runner/utils.ts","./bundler":"runner/bundler.ts","./logger":"runner/logger.ts","./server":"runner/server.ts","./analyze":"runner/analyze.ts","./test":"runner/test.ts","./post-analyze":"runner/post-analyze.ts"}],"test/test.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.test = exports.fail = exports.pass = exports.todo = exports.tests = void 0;

var _utils = require("../utils");

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
        data: Array.from(tests).map(([desc, func]) => [desc, func.toString()])
      });
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
      });
    }
  });
}
},{"../utils":"utils.ts"}],"test/assert.ts":[function(require,module,exports) {
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

var _index = require("./runner/index");

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
},{"./runner/index":"runner/index.ts","./test/index":"test/index.ts"}]},{},["index.ts"], null)
//# sourceMappingURL=index.map