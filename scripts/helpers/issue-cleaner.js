/**
 * Updates single issue.
 */

const ms = require('ms');
const config = require('../config');
const {log} = require('./logger');
const Comments = require('./comments');

const defaults= {
  commentsMaxAge: ms('30 days'),
  commentsMinCount: 5,
};

module.exports = class IssueCleaner {
  /**
   *
   * @param issue
   * @param {Object} options
   * @param {Number} options.commentsMaxAge
   * @param {Number} options.commentsMinCount
   */
  constructor(issue, options) {
    this._issue = issue;
    this._options = Object.assign({}, defaults, options);
    this._commentsHelper = new Comments(this._issue);
    this._comments = [];
    this._commentsToDelete = [];
    this._deletedCount = 0;
  }

  get deletedCount() {
    return this._deletedCount;
  }

  async clean() {
    this._logHeader();
    await this._loadComments();
    this._filterCommentsToDelete();
    this._keepMinLivingComments();
    await this._deleteComments();
  }

  async _loadComments() {
    this._comments = await this._commentsHelper.getAll();
  }

  _filterCommentsToDelete() {
    this._commentsToDelete = this._comments.filter(
      comment => Comments.getCommentAge(comment) > this._options.commentsMaxAge
    );
    log(`Comments to delete: ${this._commentsToDelete.length}`);
  }

  _keepMinLivingComments() {
    const {commentsMinCount} = this._options;
    if (this._comments.length - this._commentsToDelete.length < commentsMinCount) {
      this._commentsToDelete = this._commentsToDelete.slice(0, this._comments.length - commentsMinCount);
      log(`Comments to delete sliced to ${this._commentsToDelete.length} to keep ${commentsMinCount} living comments`);
    }
  }

  async _deleteComments() {
    for (const comment of this._commentsToDelete) {
      const commentAge = Comments.getCommentAge(comment);
      const logMessage = `Deleting comment created ${ms(commentAge, {long: true})} ago: ${comment.html_url}`;
      if (config.dryRun) {
        log(`DRY RUN: ${logMessage}`);
      } else {
        log(logMessage);
        await this._commentsHelper.delete(comment);
        log('Deleted.');
        this._deletedCount++;
      }
    }
    log(`Deleted comments: ${this._deletedCount}`);
  }

  _logHeader() {
    log(`\n== ${this._issue.title.toUpperCase()} ==`);
  }
};
