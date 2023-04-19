/**
 * Grabs trending repos from https://github.com/trending/<lang>.
 *
 * In case of error retries X times because server can response with different errors:
 * 1. "Trending repos are being dissecting." - when GitHub re-calculates trends
 * 2. "This page is taking way too long to load." - when page loads too long
 */
const axios = require('axios');
const cheerio = require('cheerio');
const promiseRetry = require('promise-retry');
const {throwIf} = require('throw-utils');
const {log, logError} = require('./logger');
const artifacts = require('./artifacts');

const RETRY_DEFAULTS = {
  retries: 5,
  minTimeout: 5000,
};

// trending page can take a long time to load
const request = axios.create({
  timeout: 30 * 1000,
});

module.exports = class Trends {
  constructor(url, retryOptions) {
    this._url = url;
    this._retryOptions = Object.assign({}, RETRY_DEFAULTS, retryOptions);
    this._html = null;
    this._$ = null;
    this._domRepos = null;
    this._repos = [];
    this._filename = this._url.split('/').pop();
  }

  /**
   * Loads trending repos (3 retries).
   *
   * @returns {Promise<Array>}
   */
  async getAll() {
    return promiseRetry((retry, attempt) => {
      const date = new Date();
      const time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
      log(`Fetching trending repos (attempt #${attempt}, ${time}): ${this._url}`);
      return this._loadRepos().catch(e => this._retry(e, retry));
    }, this._retryOptions);
  }

  async _loadRepos() {
    await this._loadHtml();
    this._constructDom();
    this._queryRepos();
    this._domRepos.each((index, repo) => this._extractRepoInfo(repo));
    if (this._repos.length > 0) {
      this._sortRepos();
      return this._repos;
    }
    if (this._isNoRepos()) {
      log(`Found message that there are no trending repos on url: ${this._url}`);
      return [];
    }
    throw new Error(`Can't find trending repos on page: ${this._url}`);
  }

  _retry(error, retryFn) {
    const response = error.response;
    if (response) {
      log(`HTTP Error: ${response.status} ${response.statusText}`);
      this._saveHtmlToArtifacts(response.data);
    } else {
      logError(error);
      this._saveHtmlToArtifacts(this._html);
    }
    retryFn(error);
  }

  async _loadHtml() {
    this._html = '';
    const response = await request(this._url, {
      headers: {
        Accept: 'text/html'
      }
    });
    this._html = response.data;
  }

  _constructDom() {
    this._$ = cheerio.load(this._html);
  }

  _queryRepos() {
    const repoSelector = '.Box-row';
    this._domRepos = this._$(repoSelector);
    log(`Found trending repos: ${this._domRepos.length} by selector: ${repoSelector}`);
  }

  _extractRepoInfo(repo) {
    const $repo = this._$(repo);
    const nameSelector = 'h2 a';
    const name = $repo.find(nameSelector).attr('href').replace(/^\//, '');
    throwIf(!name, `Can't find repo name by selector '${nameSelector}' on: ${this._url}`);
    const info = {
      name,
      url: `https://github.com/${name}`,
      description: $repo.find('p').text().trim(),
      language: $repo.find('[itemprop=programmingLanguage]').text().trim(),
      starsAdded: toNumber($repo.find(`.float-sm-right`)),
      // '*=' means 'contains'
      stars: toNumber($repo.find(`[href*="/${name}/stargazers"]`)),
      forks: toNumber($repo.find(`[href*="/${name}/forks"]`)),
    };
    this._repos.push(info);
  }

  _saveHtmlToArtifacts(html) {
    try {
      artifacts.save(`${this._filename}.html`, html);
    } catch (e) {
      logError('Error while saving artifact', e);
    }
  }

  /**
   * For some langs GitHub shows: It looks like we don’t have any trending repositories for %lang%
   */
  _isNoRepos() {
    const messageSelector = '.blankslate';
    const message = this._$(messageSelector).text();
    return message.indexOf('have any trending repositories') > 0;
  }

  _sortRepos() {
    this._repos.sort((a, b) => b.starsAdded - a.starsAdded);
  }
};

function toNumber(el) {
  return parseInt(el.text().trim().replace(',', '') || 0);
}
