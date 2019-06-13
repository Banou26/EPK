'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var PowerAssert = _interopDefault(require('power-assert'));
var rxjs = require('rxjs');
var operators = require('rxjs/operators');
var flatted = require('flatted');

var assert = PowerAssert.customize({});

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

const stringify = data => flatted.stringify(data, (key, val) => typeof val === 'function' ? {
  [EPK_FUNCTION_PROPERTY_PLACEHOLDER]: val.name
} : val);
const parse = data => flatted.parse(data, (_, val) => (val === null || val === void 0 ? void 0 : val[EPK_FUNCTION_PROPERTY_PLACEHOLDER] // Way to dynamically set a function name (to render via `util.inspect` from the reporter)
) ? {
  [val[EPK_FUNCTION_PROPERTY_PLACEHOLDER]]: () => {}
}[val[EPK_FUNCTION_PROPERTY_PLACEHOLDER]] : val);

var _subject;
const subject = globalThis[EPK_SUBJECT] = new rxjs.Subject();
const inMessages = ( // @ts-ignore
_subject = subject // @ts-ignore
, operators.map(parse)(_subject));
const sendMessage = globalThis[EPK_RUNTIME_SUBJECT];
const outMessages = new rxjs.Subject(); // @ts-ignore

outMessages.subscribe(value => sendMessage(stringify(value)));

var _inMessages;
const tests = new Map();
const todo = _ => {};
const pass = _ => {};
const fail = _ => {};
const test = (desc, func) => {
  if (typeof desc !== 'string') throw new TypeError('desc has to be a string');
  if (typeof func !== 'function') throw new TypeError('func has to be a function');
  if (tests.has(desc)) throw new Error(`Found duplicate test description: ${desc}`);
  tests.set(desc, func);
};

const getTests = () => outMessages.next({
  type: MESSAGE.GET_TESTS_RESPONSE,
  tests: Array.from(tests).map(([description, func]) => ({
    description,
    body: func.toString()
  }))
});

const runTest = async description => {
  // Empty the logs
  // logs.splice(0, logs.length)
  // todo: replace by "isBrowser ? window : require('perf_hooks')"
  const {
    performance
  } = window;
  let timeStart, timeEnd, value;

  try {
    timeStart = performance.now();
    value = await tests.get(description)();

    if (rxjs.isObservable(value)) {
      var _value;

      // @ts-ignore
      value = await (_value = value, operators.toArray()(_value)).toPromise();
    }
  } finally {
    timeEnd = performance.now();
    setTimeout(() => outMessages.next({
      type: MESSAGE.RUN_TEST_RESPONSE,
      test: {
        timeStart,
        timeEnd,
        type: rxjs.isObservable(value) ? 'observable' : value instanceof Promise ? 'promise' : 'function',
        value
      }
    }), 0);
  }
};

const messagesMap = new Map([[MESSAGE.GET_TESTS, getTests], [MESSAGE.RUN_TEST, runTest]]);
const messages = (_inMessages = inMessages // @ts-ignore
, operators.filter(({
  type
}) => type in MESSAGE)(_inMessages)); // @ts-ignore

messages.subscribe(({
  type,
  ...rest
}) => messagesMap.get(type)({
  type,
  ...rest
}));

exports.assert = assert;
exports.fail = fail;
exports.pass = pass;
exports.test = test;
exports.tests = tests;
exports.todo = todo;
//# sourceMappingURL=browser.js.map
