/**
 * Reporter for console.
 */

const ms = require('ms');
const config = require('../config');
const {log} = require('./logger');
const stat = require('./stat');

const startTime = Date.now();

exports.logStart = function () {
  log(`Issues label: ${config.issuesLabel}`);
  log(`Issues lang: ${config.lang || '*'}`);
  log(`Dry run: ${config.dryRun}`);
};

exports.logFinish = function () {
  log(`\n`);
  log(`Done.`);
  log(`Duration: ${ms(Date.now() - startTime, {long: true})}`);
  log(`Processed: ${stat.processed}`);
  log(`Updated: ${stat.updated}`);
  log(`Errors: ${stat.errors}`);
};
