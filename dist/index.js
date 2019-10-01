import '@parcel/core';
import os from 'os';
import childProcess from 'child_process';
import 'rxjs';

let PARCEL_REPORTER_EVENT;

(function (PARCEL_REPORTER_EVENT) {
  PARCEL_REPORTER_EVENT["BUILD_START"] = "buildStart";
  PARCEL_REPORTER_EVENT["BUILD_PROGRESS"] = "buildProgress";
  PARCEL_REPORTER_EVENT["BUILD_SUCCESS"] = "buildSuccess";
  PARCEL_REPORTER_EVENT["BUILD_FAILURE"] = "buildFailure";
  PARCEL_REPORTER_EVENT["LOG"] = "log";
})(PARCEL_REPORTER_EVENT || (PARCEL_REPORTER_EVENT = {}));

let amount;

if (globalThis.window !== 'undefined') {
  amount = window.navigator.hardwareConcurrency;
} else {
  const exec = command => childProcess.execSync(command, {
    encoding: 'utf8'
  });

  const platform = os.platform();

  if (platform === 'linux') {
    const output = exec('lscpu -p | egrep -v "^#" | sort -u -t, -k 2,4 | wc -l');
    amount = parseInt(output.trim(), 10);
  } else if (platform === 'darwin') {
    const output = exec('sysctl -n hw.physicalcpu_max');
    amount = parseInt(output.trim(), 10);
  } else if (platform === 'windows') {
    const output = exec('WMIC CPU Get NumberOfCores');
    amount = output.split(os.EOL).map(line => parseInt(line)).filter(value => !isNaN(value)).reduce((sum, number) => sum + number, 0);
  } else {
    const cores = os.cpus().filter(function (cpu, index) {
      const hasHyperthreading = cpu.model.includes('Intel');
      const isOdd = index % 2 === 1;
      return !hasHyperthreading || isOdd;
    });
    amount = cores.length;
  }
}

let TASK_TYPE;

(function (TASK_TYPE) {
  TASK_TYPE["PRE_ANALYZE"] = "preAnalyze";
  TASK_TYPE["RUN"] = "run";
  TASK_TYPE["ANALYZE"] = "analyze";
})(TASK_TYPE || (TASK_TYPE = {}));

let TASK_STATUS;

(function (TASK_STATUS) {
  TASK_STATUS["START"] = "start";
  TASK_STATUS["END"] = "end";
  TASK_STATUS["CANCEL"] = "cancel";
})(TASK_STATUS || (TASK_STATUS = {}));
