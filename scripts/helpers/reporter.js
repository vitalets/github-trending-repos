const config = require('../config');

const startTime = getTimestamp();

exports.start = function () {
  log(`Issues label: ${config.issuesLabel}`);
  log(`Issues lang: ${config.lang || '*'}`);
  log(`Dry run: ${config.dryRun}`);
};

exports.finish = function () {
  log(`\n`);
  log(`Done.`);
  log(`Duration (sec): ${getTimestamp() - startTime}`);
};

exports.log = log;
exports.logError = logError;

function log(...args) {
  console.log(...args);
}

function logError(...args) {
  console.error(...args);
}

function getTimestamp() {
  return Math.round(Date.now() / 1000);
}
