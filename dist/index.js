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
})({"utils.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TESTS_METADATA = exports.isBrowser = void 0;
const isBrowser = typeof window !== 'undefined';
exports.isBrowser = isBrowser;
const TESTS_METADATA = '__STEINSGATE_TESTS_METADATA';
exports.TESTS_METADATA = TESTS_METADATA;
},{}],"assert/index.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.test = exports.tests = exports.assert = void 0;

var _powerAssert = _interopRequireDefault(require("power-assert"));

var _utils = require("../utils.ts");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const assert = _powerAssert.default.customize({});

exports.assert = assert;
const tests = [];
exports.tests = tests;

const test = (desc, func) => {
  if (typeof desc !== 'string') throw new Error('desc has to be a string');
  if (typeof func !== 'function') throw new Error('func has to be a function');
  if (tests.includes(desc)) throw new Error(`Found duplicate test description: ${desc}`);
  tests.push(desc);
};

exports.test = test;
setTimeout(_ => {
  if (_utils.isBrowser) {
    var _window, _window$TESTS_METADAT;

    (_window = window) === null || _window === void 0 ? void 0 : (_window$TESTS_METADAT = _window[_utils.TESTS_METADATA]) === null || _window$TESTS_METADAT === void 0 ? void 0 : _window$TESTS_METADAT.call(_window, JSON.stringify(tests));
  }
}, 0);
},{"../utils.ts":"utils.ts"}],"runner/cli.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _commander = _interopRequireDefault(require("commander"));

var _chalk = _interopRequireDefault(require("chalk"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = _ => new Promise((resolve, reject) => {
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
exports.log = exports.x = exports.check = exports.getFrame = exports.frames = exports.prettifyTime = void 0;

var _rxjs = require("rxjs");

var _operators = require("rxjs/operators");

// import draftlog from 'draftlog'
const prettifyTime = time => time < 1000 ? `${time.toFixed()}ms` : `${(time / 1000).toFixed(2)}s`; // draftlog.into(console)


exports.prettifyTime = prettifyTime;
const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
exports.frames = frames;

const getFrame = i => frames[i % frames.length];

exports.getFrame = getFrame;
const check = '✔';
exports.check = check;
const x = '✖';
exports.x = x;

const log = (textFunction, operator) => (0, _operators.switchMap)(value => _rxjs.Observable.create(observer => {
  let completed;
  const updateLine = console.draft();
  const t1 = Date.now();
  const observable = (0, _rxjs.of)(value).pipe(operator, (0, _operators.publish)());
  const obs = observable.refCount();
  const sub = obs.subscribe(val => {
    completed = true;
    updateLine(textFunction({
      time: prettifyTime(Date.now() - t1),
      done: true,
      value
    }));
    observer.next(val);
  });
  const spinnerSub = (0, _rxjs.timer)(0, 100).pipe((0, _operators.takeUntil)(obs)).subscribe(i => updateLine(textFunction({
    icon: frames[i % frames.length],
    running: true,
    value,
    i
  })));
  observable.connect();
  return _ => {
    if (completed) return;
    sub.unsubscribe();
    spinnerSub.unsubscribe();
    updateLine(textFunction({
      cancelled: true,
      value
    }));
  };
}));

exports.log = log;
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

var _default = entryFiles => _rxjs.Observable.create(observer => {
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
    bundle
  }));
  bundler.on('buildStart', entryPoints => observer.next({
    name: 'buildStart',
    entryPoints
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
},{}],"runner/logger.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _chalk = _interopRequireDefault(require("chalk"));

var _readline = _interopRequireDefault(require("readline"));

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
  return countBreaks((0, _stripAnsi.default)('' + string));
}

var _default = new Logger();

exports.default = _default;
},{}],"runner/analyze.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _util = _interopRequireDefault(require("util"));

var _rxjs = require("rxjs");

var _operators = require("rxjs/operators");

var _utils = require("../utils.ts");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const readFile = _util.default.promisify(_fs.default.readFile);

const getTestsMetadata = (browser, bundle) => _rxjs.Observable.create(observer => {
  let cancelled;

  (async _ => {
    const [file, page] = await Promise.all([readFile(bundle.name, 'utf8'), browser.newPage()]);

    const close = _ => page.close();

    if (cancelled) return close(0); // page.on('console', msg => console.log(msg.text()))

    const result = await new Promise(async (resolve, reject) => {
      await page.exposeFunction(_utils.TESTS_METADATA, async res => {
        resolve(res);
      });
      if (cancelled) return close(1);
      page.evaluate(file).catch(_ => {});
    });
    close(2);
    observer.next(result);
  })();

  return _ => cancelled = true;
});

const pageProvider = (browser, maxPages = 5) => _rxjs.Observable.create(observer => {
  Promise.all(Array(5).map(_ => browser.newPage())).then(pages => {});
  return _ => {};
});

var _default = ({
  browser,
  maxPages = 25
}) => (0, _operators.switchMap)(rootBundle => (0, _rxjs.of)(...(rootBundle.isEmpty ? Array.from(rootBundle.childBundles) : [rootBundle])).pipe((0, _operators.mergeMap)(bundle => getTestsMetadata(browser, bundle), maxPages)));

exports.default = _default;
},{"../utils.ts":"utils.ts"}],"runner/index.ts":[function(require,module,exports) {
"use strict";

var _path = _interopRequireDefault(require("path"));

var _chalk = _interopRequireDefault(require("chalk"));

var _fastGlob = _interopRequireDefault(require("fast-glob"));

var _operators = require("rxjs/operators");

var _puppeteer = _interopRequireDefault(require("puppeteer"));

var _cli = _interopRequireDefault(require("./cli.ts"));

var _utils = require("./utils.ts");

var _bundler4 = _interopRequireDefault(require("./bundler.ts"));

var _logger = _interopRequireDefault(require("./logger.ts"));

var _analyze = _interopRequireDefault(require("./analyze.ts"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const init = async _ => {
  var _Bundler, _bundler, _ref, _bundler2, _ref2, _ref3, _ref4, _ref5, _ref6, _bundler3;

  let buildTimeStart, buildTimeEnd, analyzeTimeStart, analyzeTimeEnd;
  const globs = await (0, _cli.default)();
  const browser = await _puppeteer.default.launch({
    devtools: false
  });
  const entryFiles = (await _fastGlob.default.async(globs)).map(path => _path.default.join(process.cwd(), path));
  const entryFilesDisplayNames = entryFiles.map(path => _path.default.win32.basename(path)).join(', ');
  const bundler = (_Bundler = (0, _bundler4.default)(entryFiles), (0, _operators.publish)()(_Bundler));
  const building = (_bundler = bundler, (0, _operators.filter)(({
    name
  }) => name === 'buildStart')(_bundler));
  building.subscribe(_ => {
    _logger.default.clear();

    buildTimeStart = Date.now();

    _logger.default.progress(_chalk.default.grey(`Building ${entryFilesDisplayNames}`));
  });
  const error = (_ref = (_bundler2 = bundler, (0, _operators.filter)(({
    name
  }) => name === 'buildError')(_bundler2)), (0, _operators.catchError)(error => _logger.default.error(error))(_ref));
  error.subscribe(_ => _logger.default.error(error));
  const analyzed = (_ref2 = (_ref3 = (_ref4 = (_ref5 = (_ref6 = (_bundler3 = bundler, (0, _operators.filter)(({
    name
  }) => name === 'bundled')(_bundler3)), (0, _operators.tap)(_ => {
    buildTimeEnd = Date.now();

    _logger.default.progress(_chalk.default.green(`Built in ${(0, _utils.prettifyTime)(buildTimeEnd - buildTimeStart)}.`));
  })(_ref6)), (0, _operators.map)(({
    bundle
  }) => bundle)(_ref5)), (0, _operators.tap)(_ => {
    analyzeTimeStart = Date.now();

    _logger.default.progress(_chalk.default.grey(`Analyzing ${entryFilesDisplayNames}`));
  })(_ref4)), (0, _analyze.default)({
    browser
  })(_ref3)), (0, _operators.tap)(_ => {
    analyzeTimeEnd = Date.now();

    _logger.default.progress(_chalk.default.green(`Analyzed in ${(0, _utils.prettifyTime)(analyzeTimeEnd - analyzeTimeStart)}.`));
  })(_ref2));
  analyzed.subscribe(val => {});
  bundler.connect();
};

init();
},{"./cli.ts":"runner/cli.ts","./utils.ts":"runner/utils.ts","./bundler.ts":"runner/bundler.ts","./logger.ts":"runner/logger.ts","./analyze.ts":"runner/analyze.ts"}],"index.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _index = require("./assert/index.ts");

Object.keys(_index).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _index[key];
    }
  });
});

var _index2 = require("./runner/index.ts");

Object.keys(_index2).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _index2[key];
    }
  });
});
},{"./assert/index.ts":"assert/index.ts","./runner/index.ts":"runner/index.ts"}]},{},["index.ts"], null)
//# sourceMappingURL=index.map