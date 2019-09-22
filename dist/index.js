import '@parcel/core';
import 'rxjs';
import os from 'os';
import childProcess from 'child_process';

let PARCEL_REPORTER_EVENT;

(function (PARCEL_REPORTER_EVENT) {
  PARCEL_REPORTER_EVENT["BUILD_START"] = "buildStart";
  PARCEL_REPORTER_EVENT["BUILD_PROGRESS"] = "buildProgress";
  PARCEL_REPORTER_EVENT["BUILD_SUCCESS"] = "buildSuccess";
  PARCEL_REPORTER_EVENT["BUILD_FAILURE"] = "buildFailure";
  PARCEL_REPORTER_EVENT["LOG"] = "log";
})(PARCEL_REPORTER_EVENT || (PARCEL_REPORTER_EVENT = {}));

const exec = command => childProcess.execSync(command, {
  encoding: 'utf8'
});

let amount;
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
