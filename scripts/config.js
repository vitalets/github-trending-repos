
require('dotenv').config();
const path = require('path');
const ms = require('ms');

const config = {};

// Label for filtering issues: 'trending-daily|trending-weekly'
config.issuesLabel = process.env.TRENDING_LABEL;
// Filter issues by lang
config.lang = process.env.TRENDING_LANG || '';
// Set TRENDING_NOT_DRY_RUN=true to actually post/delete comments
config.dryRun = !process.env.TRENDING_NOT_DRY_RUN;
// Use bot's token for posting/deleting comments and vitalets token for testing (to share API requests limit)
config.githubToken = config.dryRun ? process.env.GITHUB_TOKEN_VITALETS : process.env.TRENDING_TOKEN_BOT;
config.apiUrl = 'https://api.github.com/repos/owen800q/github-trending-repos';
config.trendingUrl = 'https://github.com/trending';
config.trendingRetryOptions = {
  retries: 5,
  minTimeout: 5000,
};
config.artifactsPath = path.join('.artifacts', config.issuesLabel || '');
config.isDaily = config.issuesLabel && config.issuesLabel.indexOf('daily') >= 0;
// Period while issues should not be updated: 22 hours for daily, and 6 days for weekly. Allows to re-run script.
config.noUpdatePeriodMs = config.isDaily ? ms('22h') : ms('6d');

module.exports = config;
