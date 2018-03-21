/**
 * Logger
 */

const startTime = getTimestamp();

function log(...args) {
  console.log(...args);
}

function logError(...args) {
  console.error(...args);
}

function logDuration(label) {
  log(`${label} ${getTimestamp() - startTime}`);
}

function getTimestamp() {
  return Math.round(Date.now() / 1000);
}

module.exports = {log, logError, logDuration};
