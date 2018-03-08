const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const parseLinkHeader = require('parse-link-header');

// Label for filtering issues: 'trending-daily|trending-weekly'
const TRENDING_LABEL = process.env.TRENDING_LABEL;
if (!TRENDING_LABEL) {
  throw new Error('No TRENDING_LABEL in env variables!');
}
// Set TRENDING_POST_COMMENTS to actually post comments to issues
const TRENDING_POST_COMMENTS = Boolean(process.env.TRENDING_POST_COMMENTS);
// Filter by particular language
const TRENDING_LANG = process.env.TRENDING_LANG;
// Use bot's token for posting comments and vitalets token for testing
const GITHUB_TOKEN = TRENDING_POST_COMMENTS ? process.env.GITHUB_TOKEN_BOT : process.env.GITHUB_TOKEN_VITALETS;
if (!GITHUB_TOKEN) {
  throw new Error('No GitHub token in env variables!');
}
const ARTIFACTS_PATH = process.env.CIRCLE_ARTIFACTS || '.artifacts';

const API_URL = 'https://api.github.com/repos/vitalets/github-trending-repos';
const GITHUB_URL_REG = /https:\/\/github.com\/[^)]+/ig;

let requestCount = 0;
const errors = [];

console.log(`Filter by label: ${TRENDING_LABEL}`);
console.log(`Filter by lang: ${TRENDING_LANG || '*'}`);
console.log(`Post comments: ${TRENDING_POST_COMMENTS}`);

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });

async function main() {
  const startTime = getTimestamp();
  const issues = await getIssues();
  console.log(`Issues count: ${issues.length}`);
  for (let issue of issues) {
    try {
      await processIssue(issue);
    } catch (e) {
      await handleIssueError(e);
    }
  }
  console.log(`\nDone.`);
  console.log(`Duration (sec): ${getTimestamp() - startTime}`);
  console.log(`API requests: ${requestCount}`);
  if (errors.length > 0) {
    throw new Error(`There are errors in ${errors.length} issue(s)`);
  }
}

async function getIssues() {
  console.log(`Fetching issues...`);
  let {result} = await fetchJson(`get`, `issues?labels=${TRENDING_LABEL}&per_page=100`);
  if (TRENDING_LANG) {
    result = result.filter(issue => issue.body.indexOf(`https://github.com/trending/${TRENDING_LANG}`) >= 0);
  }
  return result;
}

async function processIssue(issue) {
  console.log(`\n== ${issue.title.toUpperCase()} ==`);
  // in test mode check that issue is locked
  if (!TRENDING_POST_COMMENTS) {
    assertIssueIsLocked(issue);
  }
  const trendingRepos = await getTrendingRepos(issue);
  if (trendingRepos.size === 0) {
    return;
  }
  await excludeKnownRepos(issue, trendingRepos);
  console.log(`New repos: ${trendingRepos.size}`);
  if (trendingRepos.size) {
    const commentBody = generateCommentBody(issue, trendingRepos);
    if (TRENDING_POST_COMMENTS) {
      await postComment(issue, commentBody);
      // wait 5s to avoid abuse rate limit: https://developer.github.com/v3/#abuse-rate-limits
      await sleep(5000);
    } else {
      console.log(`Skip posting comment!`);
      console.log(`Comment body:\n${commentBody}`);
    }
  }
}

async function getTrendingRepos(issue) {
  const url = extractTrendingUrl(issue);
  if (!url) {
    throw new Error(`Can't find trending url in body of: ${issue.url}`);
  }
  console.log(`Fetching trending repos: ${url}`);
  const body = await fetch(url).then(r => r.text());
  const $ = cheerio.load(body);
  const repos = new Map();
  const domRepos = $('li', 'ol.repo-list');
  console.log(`Current trending repos: ${domRepos.length}`);
  assertZeroTrendingRepos(domRepos, $, url);
  domRepos.each((index, repo) => {
    const info = extractTrendingRepoInfo(repo, $, url);
    repos.set(info.url, info);
  });
  return repos;
}

/**
 * Fetching known repos from comments. Considering pagination and going from the latest page to the first.
 * It allows to stop pagination requests earlier if all trending repos are known.
 */
async function excludeKnownRepos(issue, trendingRepos) {
  console.log(`Fetching known repos from issue comments...`);
  let url = `issues/${issue.number}/comments`;
  const {pages} = await fetchJson(`head`, url);
  if (pages) {
    console.log(`Comment pages: ${pages.last.page}`);
    url = pages.last.url;
  }
  while (true) {
    const {pages, result} = await fetchJson(`get`, url);
    const knownRepos = result.reduce((res, comment) => {
      const repos = comment.body.match(GITHUB_URL_REG) || [];
      return res.concat(repos);
    }, []);
    console.log(`Known trending repos: ${knownRepos.length}`);
    knownRepos.forEach(repoUrl => trendingRepos.delete(repoUrl));
    // stop when the first page achieved OR if all trending repos are found in comments
    if (!pages || !pages.prev || trendingRepos.size === 0) {
      break;
    } else {
      url = pages.prev.url;
    }
  }
}

async function postComment(issue, body) {
  const {result} = await fetchJson(`post`, `issues/${issue.number}/comments`, {body});
  if (!result.id) {
    throw new Error(JSON.stringify(result));
  } else {
    console.log(`Commented: ${result.url}`);
  }
}

async function fetchJson(method, path, data) {
  method = method.toUpperCase();
  const url = /^https?:/.test(path) ? path : `${API_URL}/${path}`;
  console.log(method, url);
  requestCount++;
  const response = await fetch(url, {
    method,
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': `token ${GITHUB_TOKEN}`
    },
    body: JSON.stringify(data)
  });
  if (response.ok) {
    const pages = parseLinkHeader(response.headers.get('link'));
    const result = method !== 'HEAD' ? await response.json() : null;
    return {pages, result};
  } else {
    const text = await response.text();
    throw new Error(`${response.status} ${response.statusText} ${text}`);
  }
}

async function handleIssueError(error) {
  if (TRENDING_POST_COMMENTS) {
    errors.push(error);
    console.error(error);
    await sleep(1000);
  } else {
    throw error;
  }
}

function generateCommentBody(issue, newTrendingRepos) {
  const since = issue.title.indexOf('daily') >= 0 ? 'today' : 'this week';
  const header = `**${issue.title}!**`;
  const commentItems = [];
  newTrendingRepos.forEach(repo => {
    const commentItem = [
      `[${repo.name.replace('/', ' / ')}](${repo.url})`,
      repo.description,
      repo.starsAdded ? `***+${repo.starsAdded}** stars ${since}*` : '',
    ].filter(Boolean).join('\n');
    commentItems.push(commentItem);
  });
  return [header, ...commentItems].join('\n\n');
}

function extractTrendingRepoInfo(repo, $, url) {
  const name = $(repo).find('h3').text().trim().replace(/ /g, '');
  if (!name) {
    throw new Error(`Can't extract repo name. Check selector 'h3' on: ${url}`);
  }
  return {
    name,
    url: `https://github.com/${name}`,
    description: $(repo).find('p', '.py-1').text().trim(),
    language: $(repo).find('[itemprop=programmingLanguage]').text().trim(),
    // For non-popular languages GitHub may not provide stars added
    starsAdded: toNumber($(repo).find(`.float-sm-right`)),
    stars: toNumber($(repo).find(`[href="/${name}/stargazers"]`)),
    forks: toNumber($(repo).find(`[href="/${name}/network"]`)),
  };
}

function assertZeroTrendingRepos(domRepos, $, url) {
  if (domRepos.length === 0) {
    // When GitHub is re-calculating trending repos - it shows this message
    const TRENDING_REPOS_DISSECTED_MSG = 'Trending repositories results are currently being dissected';
    const isDissecting = $('.blankslate').text().indexOf(TRENDING_REPOS_DISSECTED_MSG) >= 0;
    const isTimeouted = $.text().indexOf('This page is taking way too long to load') >= 0;
    if (isDissecting) {
      console.log(`Trending repos are being dissecting.`);
    } else if (isTimeouted) {
      console.log(`Page timeouted.`);
    } else {
      const filename = url.match(/trending\/(.+)$/)[1];
      saveArtifact(`${filename}.html`, $.html());
      throw new Error(`Can't retrieve trending repos from: ${url}`);
    }
  }
}

function saveArtifact(filename, content) {
  try {
    if (!fs.existsSync(ARTIFACTS_PATH)) {
      fs.mkdirSync(ARTIFACTS_PATH);
    }
    const filepath = path.join(ARTIFACTS_PATH, filename);
    console.log(`Saving artifact: ${filepath}`);
    fs.writeFileSync(filepath, content, 'utf-8');
  } catch (e) {
    console.error(e);
  }
}

function assertIssueIsLocked(issue) {
  if (!issue.locked) {
    throw new Error(`Unlocked issue: ${issue.html_url}`);
  }
}

function extractTrendingUrl(issue) {
  const matches = issue.body.match(GITHUB_URL_REG);
  if (!matches) {
    throw new Error(`Can't find trending url in body of: ${issue.url}: ${issue.body}`);
  }
  return matches[0];
}

function toNumber(el) {
  return parseInt(el.text().trim().replace(',', '') || 0);
}

function getTimestamp() {
  return Math.round(Date.now() / 1000);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
