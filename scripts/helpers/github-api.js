/**
 * GitHub API.
 */

const assert = require('assert');
const axios = require('axios');
const axiosRetry = require('axios-retry');
const parseLinkHeader = require('parse-link-header');
const config = require('../config');
const {log} = require('./logger');

assert(config.githubToken, 'Empty GitHub token. Check env variables.');

const request = axios.create({
  baseURL: config.apiUrl,
  headers: {
    Accept: 'application/vnd.github.v3+json',
    Authorization: `token ${config.githubToken}`,
  }
});

axiosRetry(request, {
  retries: 3,
  retryDelay: retryNumber => {
    log(`Request retry attempt: ${retryNumber}`);
    return axiosRetry.exponentialDelay(retryNumber);
  }
});

/**
 * Performs request to GitHub API.
 *
 * @param {String} method
 * @param {String} url
 * @param {JSON} [data]
 * @returns {Promise<{pages: Array, result: JSON}>}
 */
exports.fetchJson = async function (method, url, data) {
  method = method.toUpperCase();
  log(method, url);
  const response = await request({method, url, data});
  const pages = parseLinkHeader(response.headers.link);
  return {result: response.data, pages};
  // if (response.ok) {
  //   const pages = parseLinkHeader(response.headers.get('link'));
  //   const result = method !== 'HEAD' ? await response.json() : null;
  //   return {pages, result};
  // } else {
  //   throw new Error(`${response.status} ${response.statusText} ${response.data}`);
  // }
};
