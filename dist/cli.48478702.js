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
})({"cli/parser.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.options = exports.command = exports.args = exports.action = void 0;

var _commander = _interopRequireDefault(require("commander"));

var _chalk = _interopRequireDefault(require("chalk"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const helpMessage = `
Run \`${_chalk.default.bold('epk help <command>')}\` for more information on specific commands
`;

const list = v => v.split(',');

let action, args;
exports.args = args;
exports.action = action;

_commander.default.command('serve [input...]').description('starts a development server').option('-d, --out-dir path', 'Output directory').option('-t, --target [target]', 'Set parcel target to [node, browser, electron]', undefined, 'browser').option('-b, --browsers [target]', 'Set parcel target to [chrome, firefox]', list, ['chrome']).action(_args => {
  exports.action = action = 'serve';
  exports.args = args = _args;
});

_commander.default.command('help [command]').description('display help information for a command').action(command => (_commander.default.commands.find(c => c.name() === command) || _commander.default).help());

_commander.default.on('--help', _ => console.log(helpMessage)); // Make serve the default command except for --help


const _args = process.argv;
if (_args[2] === '--help' || _args[2] === '-h') _args[2] = 'help';

if (!_args[2] || !_commander.default.commands.some(c => c.name() === _args[2])) {
  _args.splice(2, 0, 'serve');
}

const command = _commander.default.parse(_args);

exports.command = command;

const options = _commander.default.opts();

exports.options = options;
},{}],"cli/reporter.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _operators = require("rxjs/operators");

var _types = require("../types");

var _chalk = _interopRequireDefault(require("chalk"));

var _logger = _interopRequireDefault(require("./logger"));

var _utils = require("../utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// |> tap(({ entryFiles  }: Context) => {
//   logger.clear()
//   logger.progress(`\n${chalk.grey(`Building ${entryFiles.map(prettifyPath).join(', ')}`)}`)
// })
const formatTest = ({
  description,
  errors
}) => `\
  ${description}
${errors.map(({
  message
}) => `\
   ${_chalk.default.gray(message.split('\n').shift().trim())}
 
${_chalk.default.red(message.split('\n').splice(2).map(str => `  ${str}`).join('\n'))}`).join('\n\n')}`;

const formatTests = ({
  name,
  tests = []
}) => tests.length ? `\
 ${_chalk.default.underline((0, _utils.prettifyPath)(name))}

${tests.map(formatTest).join('\n')}` : ''; // buildTime, analyzeTime, testTime,
// ${chalk.green(`Built in ${buildTime}.`)}
// ${chalk.green(`Analyzed in ${analyzeTime}.`)}
// ${chalk.green(`Tested in ${testTime}.`)}


const formatAnalyzing = files => {
  const analyzingFiles = files.filter(({
    type
  }) => _types.FileType.ANALYZE === type);
  return analyzingFiles.length ? `Analyzing ${analyzingFiles.map(({
    name
  }) => (0, _utils.prettifyPath)(name)).join(', ')}\n\n` : '';
};

const formatErrors = files => `\
${_chalk.default.reset.red(`Errors:`)}
${_chalk.default.reset(files.map(({
  tests,
  ...rest
}) => ({
  tests: tests.filter(({
    errors
  }) => !!(errors && errors.length)),
  ...rest
})).map(formatTests).join('\n'))}`;

const formatFileStatus = files => `
${_chalk.default.reset(`Files:`)}
${files.map(({
  name,
  tests
}) => {
  const isFinished = tests.every(({
    type
  }) => !!type);
  const finishedTests = tests.filter(({
    type
  }) => type);
  const erroredTests = tests.filter(({
    errors
  }) => errors);
  const hasErrors = erroredTests.length;
  const successful = hasErrors ? `(${finishedTests.length - erroredTests.length})` : '';
  return _chalk.default.reset[!isFinished ? 'gray' : hasErrors ? 'red' : 'green'](`${(0, _utils.prettifyPath)(name)} ${finishedTests.length}${successful}/${tests.length}`);
}).map(str => ` ${str}`).join('\n')}`;

const format = files => `
${formatAnalyzing(files)}\
${formatErrors(files)}\
${formatFileStatus(files)}`;

var _default = options => (0, _operators.scan)((state, val) => {
  // File | Context
  if (val.name === 'buildStart') {
    _logger.default.clear();

    _logger.default.progress(`\n${_chalk.default.grey(`Bundling...`)}`);

    return {
      files: []
    };
  } else if (val.name === 'bundled') {
    _logger.default.progress(`\n${_chalk.default.grey(`Bundled`)}`);

    return {
      bundle: val.bundle,
      ...state
    };
  }

  const file = val;
  const {
    files
  } = state;
  const foundFile = files.find(({
    name
  }) => val.name === name);
  const currentFile = foundFile || file;

  if (file.type === _types.FileType.ANALYZE) {
    const foundFile = files.find(({
      name
    }) => val.name === name);
    if (!foundFile) files.push(file);else Object.assign(foundFile, file);
  } else if (file.type === _types.FileType.TEST) {
    if (!currentFile.tests) currentFile.tests = [];
    const test = file.test;
    const foundTest = currentFile.tests.find(({
      description
    }) => test.description === description);
    if (foundTest) Object.assign(foundTest, test);else if (!foundTest) currentFile.tests.push(test);
    const fileIsDone = currentFile.tests.every(test => 'value' in test);
    currentFile.type = fileIsDone ? _types.FileType.DONE : _types.FileType.TEST;
  }

  const isFinished = files.length && files.every(({
    type
  }) => _types.FileType.DONE === type);

  _logger.default[isFinished ? 'success' : 'progress'](format(files)); // if (isFinished) debugger


  return state;
}, undefined);

exports.default = _default;
},{"../types":"types.ts","./logger":"cli/logger.ts","../utils":"utils/index.ts"}],"cli/index.ts":[function(require,module,exports) {
"use strict";

var _index = _interopRequireDefault(require("../core/index"));

var _parser = require("./parser");

var _reporter = _interopRequireDefault(require("./reporter"));

var _logger = _interopRequireDefault(require("./logger"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// @ts-ignore
(0, _reporter.default)({})((0, _index.default)({
  watch: _parser.action === 'serve',
  target: _parser.options.target,
  entryFiles: _parser.args,
  browsers: _parser.options.browsers
})).subscribe(() => {}, err => _logger.default.error(err));
},{"../core/index":"core/index.ts","./parser":"cli/parser.ts","./reporter":"cli/reporter.ts","./logger":"cli/logger.ts"}]},{},[], null)
//# sourceMappingURL=cli.48478702.map