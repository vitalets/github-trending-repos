
const ms = require('ms');

const config = {};

// Label for filtering issues: 'trending-daily|trending-weekly'
config.issuesLabel = process.env.TRENDING_LABEL;
// Filter issues by lang
config.lang = process.env.TRENDING_LANG || '';
// Set $TRENDING_POST_COMMENTS=true to actually post comments to issues
config.dryRun = !process.env.TRENDING_POST_COMMENTS;
// Use bot's token for posting comments and vitalets token for testing to share API requests limit
config.githubToken = config.dryRun ? process.env.GITHUB_TOKEN_VITALETS : process.env.GITHUB_TOKEN_BOT;
config.apiUrl = 'https://api.github.com/repos/vitalets/github-trending-repos';
config.trendingUrl = 'https://github.com/trending';
config.artifactsPath = process.env.CIRCLE_ARTIFACTS || '.artifacts';
config.isDailyRun = config.issuesLabel && config.issuesLabel.indexOf('daily') >= 0;
// Period while issues should not be updated: 22 hours for daily, and 6 days for weekly. Allows to re-run script.
config.noUpdatePeriodMs = config.isDailyRun ? ms('22h') : ms('6d');

module.exports = config;
