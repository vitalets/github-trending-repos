/**
 * Works with comments of particular issue.
 */

const {log} = require('./logger');
const githubApi = require('./github-api');

const GITHUB_URL_REG = /https:\/\/github.com\/[^)]+/ig;

module.exports = class Comments {
  constructor(issue) {
    this._issue = issue;
    this._url = `issues/${this._issue.number}/comments`;
    this._nextPageUrl = this._url;
    this._comments = [];
  }

  get lastCommentTimestamp() {
    const lastComment = this._comments && this._comments[this._comments.length - 1];
    return lastComment ? new Date(lastComment.created_at).valueOf() : 0;
  }

  /**
   * Gets all comments (from all pages) for provided issue.
   *
   * @returns {Promise<Array>}
   */
  async getAll() {
    log(`Fetching comments...`);
    do {
      await this._loadCommentsPage();
    } while (this._nextPageUrl);
    log(`Fetched comments: ${this._comments.length}`);
    return this._comments;
  }

  /**
   * Posts new comment.
   *
   * @param {String} body
   * @returns {Promise}
   */
  async post(body) {
    return (await githubApi.fetchJson(`post`, this._url, {body})).result;
  }

  /**
   * Delete single comment.
   * @param {Object} comment
   */
  async delete(comment) {
    return (await githubApi.fetchJson(`delete`, comment.url)).result;
  }

  async _loadCommentsPage() {
    const {result, pages} = await githubApi.fetchJson(`get`, this._nextPageUrl);
    this._comments.push(...result);
    this._nextPageUrl = pages && pages.next && pages.next.url;
  }

  static extractRepos(comment) {
    return comment.body.match(GITHUB_URL_REG) || [];
  }

  /**
   * Returns comment age in ms.
   */
  static getCommentAge(comment) {
    return Date.now() - new Date(comment.created_at).valueOf();
  }
};
