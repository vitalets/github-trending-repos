/**
 * Main script for updating issues with new trending repos.
 *
 * 1. Loads all issues with trending label
 * 2. For each issues loads trends and comments
 * 3. Checks for new repos and posts comment
 */

const config = require('./config');
const {log, logError, logDuration} = require('./helpers/logger');
const Issues = require('./helpers/issues');
const IssueUpdater = require('./helpers/issue-updater');

const stat = {processed: 0, updated: 0, errors: 0};

main()
  .catch(e => {
    logError(e);
    process.exit(1);
  });

async function main() {
  logStart();
  await updateIssues();
  logFinish();
  throwIfErrors();
}

async function updateIssues() {
  const issues = await new Issues(config.issuesLabel, config.lang).getAll();
  for (const issue of issues) {
    try {
      log(`Issue ${stat.processed + 1} of ${issues.length}`);
      const updater = new IssueUpdater(issue);
      await updater.update();
      handleIssueSuccess(updater.updated);
    } catch(e) {
      handleIssueError(e);
    } finally {
      stat.processed++;
    }
  }
}

function logStart() {
  log(`Issues label: ${config.issuesLabel}`);
  log(`Issues lang: ${config.lang || '*'}`);
  log(`Dry run: ${config.dryRun}`);
}

function logFinish() {
  log(`\n`);
  log(`Done.`);
  logDuration(`Duration (sec):`);
  log(`Processed: ${stat.processed}`);
  log(`Updated: ${stat.updated}`);
  log(`Errors: ${stat.errors}`);
}

function throwIfErrors() {
  if (stat.errors > 0) {
    throw new Error(`There are ${stat.errors} error(s)`);
  }
}

function handleIssueError(error) {
  stat.errors++;
  if (config.dryRun) {
    throw error;
  } else {
    logError(error);
  }
}

function handleIssueSuccess(updated) {
  if (updated) {
    stat.updated++;
  }
}
