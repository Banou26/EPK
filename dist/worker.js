import { parentPort } from 'worker_threads';

parentPort.on('message', message => console.log('received', message));
parentPort.postMessage({
  foo: 'bar'
});
