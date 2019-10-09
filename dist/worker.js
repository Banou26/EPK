'use strict';

var worker_threads = require('worker_threads');
var rxjs = require('rxjs');

const tasks = rxjs.fromEvent(worker_threads.parentPort, 'message');
tasks.subscribe(task => console.log(task));
//# sourceMappingURL=worker.js.map
