/**
 * Clean outdated comments.
 */

const ms = require('ms');
const config = require('./config');
const {log, logError} = require('./helpers/logger');
const reporter = require('./helpers/reporter');
const stat = require('./helpers/stat');
const Issues = require('./helpers/issues');
const IssueCleaner = require('./helpers/issue-cleaner');

const cleanerOptions = {
  commentsMaxAge: ms('30 days'),
  // always keep some comments in issue
  commentsMinCount: config.isDaily ? 5 : 3,
};

main()
  .catch(e => {
    logError(e);
    process.exit(1);
  });

async function main() {
  reporter.logStart();
  await cleanIssues();
  reporter.logFinish();
  throwIfErrors();
}

async function cleanIssues() {
  log(`Delete comments older than: ${ms(cleanerOptions.commentsMaxAge, {long: true})}`);
  const issues = await new Issues(config.issuesLabel, config.lang).getAll();
  for (const issue of issues) {
    try {
      const cleaner = new IssueCleaner(issue, cleanerOptions);
      await cleaner.clean();
      handleIssueSuccess(cleaner.deletedCount > 0);
    } catch(e) {
      handleIssueError(e);
    } finally {
      stat.processed++;
      log(`Issue ${stat.processed} of ${issues.length}`);
    }
  }
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
