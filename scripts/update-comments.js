/**
 * Main script for updating comments with new trending repos.
 *
 * 1. Loads all issues with trending label
 * 2. For each issues loads trends and comments
 * 3. Checks for new repos and posts comment
 */

const R = require('ramda');
const config = require('./config');
const reporter = require('./helpers/reporter');
const errors = require('./helpers/errors');
const Issues = require('./helpers/issues');
const Trends = require('./helpers/trends');
const Comments = require('./helpers/comments');

main()
  .catch(e => {
    reporter.logError(e);
    process.exit(1);
  });

async function main() {
  reporter.start();
  const issues = await new Issues(config.issuesLabel, config.lang).getAll();
  for (const issue of issues) {
    try {
      await new IssueProcessor(issue).process();
    } catch(e) {
      errors.handleIssueError(e);
    }
  }
  reporter.finish();
  if (errors.getCount() > 0) {
    throw new Error(`There are ${errors.getCount()} error(s)`);
  } else {
    reporter.log(`Errors: 0`);
  }
}

class IssueProcessor {
  constructor(issue) {
    this._issue = issue;
    this._commentsHelper = new Comments(this._issue);
    this._trendingRepos = [];
    this._knownRepos = [];
    this._newRepos = [];
  }

  async process() {
    this._logHeader();
    await this._loadTrendingRepos();
    if (this._trendingRepos.length) {
      await this._loadKnownRepos();
      this._detectNewRepos();
    }
    if (this._newRepos.length) {
      await this._postComment();
    }
  }

  async _loadTrendingRepos() {
    const trendingUrl = Issues.extractTrendingUrl(this._issue);
    this._trendingRepos = await new Trends(trendingUrl).getAll();
  }

  async _loadKnownRepos() {
    const comments = await this._commentsHelper.getAll();
    this._knownRepos = R.pipe(R.map(Comments.extractRepos), R.flatten)(comments);
    reporter.log(`Known repos: ${this._knownRepos.length}`);
  }

  async _postComment() {
    const body = this._generateCommentBody();
    if (config.dryRun) {
      reporter.log(`DRY RUN! Skip posting comment.\nComment body:\n${body}`);
      return;
    }
    const result = await this._commentsHelper.post(body);
    if (result.url) {
      reporter.log(`Commented: ${result.url}`);
    } else {
      throw new Error(JSON.stringify(result));
    }
  }

  _detectNewRepos() {
    this._newRepos = R.differenceWith((a, b) => a.url === b, this._trendingRepos, this._knownRepos);
    reporter.log(`New repos: ${this._newRepos.length}`);
  }

  _logHeader() {
    reporter.log(`\n== ${this._issue.title.toUpperCase()} ==`);
  }

  _generateCommentBody() {
    const since = this._issue.title.indexOf('daily') >= 0 ? 'today' : 'this week';
    const header = `**${this._issue.title}!**`;
    const commentItems = this._newRepos.map(repo => {
      return [
        `[${repo.name.replace('/', ' / ')}](${repo.url})`,
        repo.description,
        repo.starsAdded ? `***+${repo.starsAdded}** stars ${since}*` : '',
      ].filter(Boolean).join('\n');
    });
    return [header, ...commentItems].join('\n\n');
  }
}
