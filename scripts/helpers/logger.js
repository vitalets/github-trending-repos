/**
 * Logger
 */

function log(...args) {
  console.log(...args);
}

function logError(error) {
  console.error(error.stack || error.message || error);
}

module.exports = {log, logError};
