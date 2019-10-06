'use strict';

var worker_threads = require('worker_threads');

worker_threads.parentPort.on('message', message => console.log('received', message));
worker_threads.parentPort.postMessage({
  foo: 'bar'
});
//# sourceMappingURL=worker.js.map
