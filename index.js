const fetch = require('node-fetch');
const cheerio = require('cheerio');
const parseLinkHeader = require('parse-link-header');

// when DRY_RUN issues are not commented
const DRY_RUN = Boolean(process.env.DRY_RUN);
// filter by particular language
const TRENDING_LANG = process.env.TRENDING_LANG;
const GITHUB_TOKEN = DRY_RUN ? process.env.GITHUB_TOKEN_VITALETS : process.env.GITHUB_TOKEN_BOT;
const API_URL = 'https://api.github.com/repos/vitalets/github-trending-repos';
const ISSUE_LABEL_DAILY = 'trending-daily';
const ISSUE_LABEL_WEEKLY = 'trending-weekly';
const GITHUB_URL_REG = /https:\/\/github.com\/[^)]+/ig;
// sometimes GitHub shows this message on trending page
const TRENDING_REPOS_DISSECTED_MSG = 'Trending repositories results are currently being dissected';
const MIN_STARS = 20;

let requestCount = 0;

console.log(`Dry run: ${DRY_RUN}`);
console.log(`Filter by lang: ${TRENDING_LANG || '*'}`);
console.log(`Limit by stars: ${MIN_STARS}`);

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });

async function main() {
  const startTime = getTimestamp();
  if (!GITHUB_TOKEN) {
    throw new Error('No GitHub token in env variables!');
  }
  let issues = await getIssues();
  if (TRENDING_LANG) {
    issues = issues.filter(issue => issue.body.indexOf(`https://github.com/trending/${TRENDING_LANG}`) >= 0);
  }
  console.log(`Fetched issues: ${issues.length}`);
  for (let issue of issues) {
    await processIssue(issue);
  }
  console.log(`\nDone.`);
  console.log(`Duration (sec): ${getTimestamp() - startTime}`);
  console.log(`API requests: ${requestCount}`);
}

async function getIssues() {
  const res = await Promise.all([
    fetchJson(`get`, `issues?labels=${ISSUE_LABEL_DAILY}`),
    fetchJson(`get`, `issues?labels=${ISSUE_LABEL_WEEKLY}`),
  ]);
  return [...res[0].result, ...res[1].result];
}

async function processIssue(issue) {
  console.log(`\n== ${issue.title.toUpperCase()} ==`);
  const trendingRepos = await getTrendingRepos(issue);
  if (trendingRepos.size === 0) {
    return;
  }
  await excludeKnownRepos(issue, trendingRepos);
  console.log(`New repos: ${trendingRepos.size}`);
  if (trendingRepos.size) {
    trendingRepos.forEach(r => console.log(`  ${r.name} +${r.starsAdded}`));
    await postComment(issue, trendingRepos);
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
    if (info.starsAdded >= MIN_STARS) {
      repos.set(info.url, info);
    }
  });
  return repos;
}

/**
 * Fetching known repos from comments. Considering pagination and going from the latest page to the first.
 * It allows to stop pagination requests earlier if all trending repos are known.
 */
async function excludeKnownRepos(issue, trendingRepos) {
  console.log(`Fetching known repos from comments...`);
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
    // stop on first page OR if all trending repos are known
    if (!pages || !pages.prev || trendingRepos.size === 0) {
      break;
    } else {
      url = pages.prev.url;
    }
  }
}

async function postComment(issue, newTrendingRepos) {
  const since = issue.labels.find(l => l.name === ISSUE_LABEL_DAILY) ? 'today' : 'this week';
  const header = `**${issue.title}!**`;
  const commentItems = [];
  newTrendingRepos.forEach(repo => {
    const commentItem = [
      `[${repo.name.replace('/', ' / ')}](${repo.url})`,
      repo.description,
      repo.starsAdded ? `***+${repo.starsAdded}** stars ${since}*` : `*No info about stars ${since}*`
    ].filter(Boolean).join('\n');
    commentItems.push(commentItem);
  });
  const body = [header, ...commentItems].join('\n\n');
  if (DRY_RUN) {
    console.log(`dry run: skip commenting!`);
    return;
  }
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
    const isDissecting = $('.blankslate').text().indexOf(TRENDING_REPOS_DISSECTED_MSG) >= 0;
    if (isDissecting) {
      console.log(`Trending repos are being dissecting.`);
    } else {
      throw new Error(`Can't retrieve trending repos from: ${url}`);
    }
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
