const config = require('../config');
const {logError} = require('./reporter');

const errors = [];

exports.handleIssueError = function (error) {
  errors.push(error);
  if (config.dryRun) {
    throw error;
  } else {
    logError(error);
  }
};

exports.getCount = function () {
  return errors.length;
};
