/**
 * Logger
 */

function log(...args) {
  console.log(...args);
}

function logError(error) {
  const message = error.stack || error.message || String(error);
  console.error(message);
  if (error && error.response) {
    console.log('Response:', error.response.data);
    console.log('Headers:', error.response.headers);
  }
}

module.exports = {log, logError};
