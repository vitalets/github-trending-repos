/**
 * Updates single issue.
 */

const R = require('ramda');
const ms = require('ms');
const Timeout = require('await-timeout');
const config = require('../config');
const {log} = require('./logger');
const Translator = require('./translator');
const Issues = require('./issues');
const Trends = require('./trends');
const Comments = require('./comments');

module.exports = class IssueUpdater {
  constructor(issue) {
    this._issue = issue;
    this._commentsHelper = new Comments(this._issue);
    this._trendingRepos = [];
    this._knownRepos = [];
    this._newRepos = [];
    this._commentBody = '';
    this._updated = false;
  }

  get updated() {
    return this._updated;
  }

  async update() {
    this._logHeader();
    await this._loadTrendingRepos();
    if (this._trendingRepos.length) {
      await this._loadKnownRepos();
      this._detectNewRepos();
    } else {
      log('No trending repos. Skipping.');
    }
    if (this._newRepos.length) {
      await this._processNewRepos();
    }
  }

  async _processNewRepos() {
    await this._generateCommentBody();
    if (this._shouldUpdate()) {
      await this._postComment();
      // wait 1 second after comment
      await Timeout.set(1000);
    }
  }

  async _loadTrendingRepos() {
    const trendingUrl = Issues.extractTrendingUrl(this._issue);
    this._trendingRepos = await new Trends(trendingUrl, config.trendingRetryOptions).getAll();
  }

  async _loadKnownRepos() {
    const comments = await this._commentsHelper.getAll();
    this._knownRepos = R.pipe(R.map(Comments.extractRepos), R.flatten)(comments);
    log(`Known repos: ${this._knownRepos.length}`);
  }

  async _postComment() {
    const result = await this._commentsHelper.post(this._commentBody);
    if (result.url) {
      this._updated = true;
      log(`Commented: ${result.html_url}`);
    } else {
      throw new Error(JSON.stringify(result));
    }
  }

  _shouldUpdate() {
    if (config.dryRun) {
      log(`DRY RUN! Skip posting comment.\nComment body:\n${this._commentBody}`);
      return false;
    }
    const timeSinceLastUpdate = Date.now() - this._commentsHelper.lastCommentTimestamp;
    if (timeSinceLastUpdate < config.noUpdatePeriodMs) {
      log([
        `RECENTLY UPDATED (${ms(timeSinceLastUpdate)} ago)! Skip posting comment.`,
        `Comment body:\n${this._commentBody}`
      ].join('\n'));
      return false;
    }
    return true;
  }

  _detectNewRepos() {
    this._newRepos = R.differenceWith((a, b) => a.url === b, this._trendingRepos, this._knownRepos);
    log(`New repos: ${this._newRepos.length}`);
  }

  _logHeader() {
    log(`\n== ${this._issue.title.toUpperCase()} ==`);
  }

  async _generateCommentBody() {
    const since = this._issue.title.indexOf('daily') >= 0 ? 'today' : 'this week';
    const header = `**${this._issue.title}!**`;
    const commentItems = await Promise.all(this._newRepos.map(repo => this._generateRepoMarkdown(repo, since)));
    this._commentBody = [header, ...commentItems].join('\n\n');
  }

  async _generateRepoMarkdown(repo, since) {
    const translated = await new Translator(repo.description).toEn();
    return [
      `[${repo.name.replace('/', ' / ')}](${repo.url})`,
      repo.description,
      translated ? `> ${translated}\n` : '',
      repo.starsAdded ? `***+${repo.starsAdded}** stars ${since}*` : '',
    ].filter(Boolean).join('\n');
  }
};
