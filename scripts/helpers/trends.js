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
    if (this._repos.length === 0) {
      throw new Error(`Can't find trending repos on page: ${this._url}`);
    }
    return this._repos;
  }

  _retry(error, retryFn) {
    const r = error.response;
    if (r) {
      log(`Error: ${r.status} ${r.statusText}`);
      this._saveHtmlToArtifacts(r.data);
    } else {
      logError(error);
      this._saveHtmlToArtifacts(this._html);
    }
    retryFn(error);
  }

  async _loadHtml() {
    this._html = '';
    this._html = (await request(this._url)).data;
  }

  _constructDom() {
    this._$ = cheerio.load(this._html);
  }

  _queryRepos() {
    this._domRepos = this._$('li', 'ol.repo-list');
    log(`Found trending repos: ${this._domRepos.length}`);
  }

  _extractRepoInfo(repo) {
    const $repo = this._$(repo);
    const name = $repo.find('h3').text().trim().replace(/ /g, '');
    if (!name) {
      throw new Error(`Can't extract repo name. Check selector 'h3' on: ${this._url}`);
    }
    const info = {
      name,
      url: `https://github.com/${name}`,
      description: $repo.find('p', '.py-1').text().trim(),
      language: $repo.find('[itemprop=programmingLanguage]').text().trim(),
      starsAdded: toNumber($repo.find(`.float-sm-right`)),
      stars: toNumber($repo.find(`[href="/${name}/stargazers"]`)),
      forks: toNumber($repo.find(`[href="/${name}/network"]`)),
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
};

function toNumber(el) {
  return parseInt(el.text().trim().replace(',', '') || 0);
}
