const fetch = require('node-fetch');
const cheerio = require('cheerio');

const DRY_RUN = Boolean(process.env.DRY_RUN);
const TRENDING_LANG = process.env.TRENDING_LANG;
const GITHUB_TOKEN = DRY_RUN ? process.env.GITHUB_TOKEN_VITALETS : process.env.GITHUB_TOKEN_BOT;
const API_URL = 'https://api.github.com/repos/vitalets/github-trending-repos';
const ISSUE_LABEL_DAILY = 'trending-daily';
const ISSUE_LABEL_WEEKLY = 'trending-weekly';
const GITHUB_URL_REG = /https:\/\/github.com\/[^)]+/ig;
// sometimes GitHub shows this message on trending page
const TRENDING_REPOS_DISSECTED_MSG = 'Trending repositories results are currently being dissected';
const MIN_STARS = 10;

console.log(`DRY_RUN: ${DRY_RUN}`);
console.log(`FILTER BY LANG: ${TRENDING_LANG || '*'}`);

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });

async function main() {
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
  console.log('\nDone.');
}

async function getIssues() {
  const res = await Promise.all([
    fetchJson(`get`, `issues?labels=${ISSUE_LABEL_DAILY}`),
    fetchJson(`get`, `issues?labels=${ISSUE_LABEL_WEEKLY}`),
  ]);
  return [...res[0], ...res[1]];
}

async function processIssue(issue) {
  console.log(`\n== ${issue.title.toUpperCase()} ==`);
  const trendingRepos = await getTrendingRepos(issue);
  if (trendingRepos.size === 0) {
    return;
  }
  const knownRepos = await getKnownRepos(issue);
  console.log(`Known repos: ${knownRepos.size}`);
  const newRepos = selectNewRepos(trendingRepos, knownRepos);
  console.log(`New repos: ${newRepos.length}`);
  if (newRepos.length) {
    newRepos.forEach(r => console.log(`  ${r.name} +${r.starsAdded}`));
    await postComment(issue, newRepos);
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
  console.log(`Found trending repos: ${domRepos.length}`);
  assertZeroTrendingRepos(domRepos);
  domRepos.each((index, repo) => {
    const info = extractTrendingRepoInfo(repo, $);
    if (info.starsAdded >= MIN_STARS) {
      repos.set(info.name, info);
    }
  });
  return repos;
}

async function getKnownRepos(issue) {
  const comments = await fetchJson(`get`, `issues/${issue.number}/comments`);
  const repos = new Set();
  comments.forEach(comment => {
    const names = comment.body.match(GITHUB_URL_REG);
    if (names) {
      names.forEach(name => repos.add(name));
    }
  });
  return repos;
}

function selectNewRepos(trendingRepos, knownRepos) {
  const result = [];
  for (let trendingRepo of trendingRepos.values()) {
    if (!knownRepos.has(trendingRepo.url)) {
      result.push(trendingRepo);
    }
  }
  return result;
}

async function postComment(issue, newRepos) {
  const since = issue.labels.find(l => l.name === ISSUE_LABEL_DAILY) ? 'today' : 'this week';
  const header = `**${issue.title}!**`;
  const items = newRepos.map(repo => {
    return [
      `[${repo.name.replace('/', ' / ')}](${repo.url})`,
      repo.description,
      `***+${repo.starsAdded}** stars ${since}*`
    ].filter(Boolean).join('\n');
  });
  const body = [header, ...items].join('\n\n');
  if (DRY_RUN) {
    console.log(`dry run: skip posting comment.`);
    return;
  }
  const result = await fetchJson(`post`, `issues/${issue.number}/comments`, {body});
  if (!result.id) {
    throw new Error(JSON.stringify(result));
  } else {
    console.log(`Commented: ${result.url}`);
  }
}

async function fetchJson(method, path, data) {
  const url = `${API_URL}/${path}`;
  console.log(method, url);
  const response = await fetch(url, {
    method,
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': `token ${GITHUB_TOKEN}`
    },
    body: JSON.stringify(data)
  });
  if (response.ok) {
    return await response.json();
  } else {
    const text = await response.text();
    throw new Error(`${response.status} ${response.statusText} ${text}`);
  }
}

function extractTrendingRepoInfo(repo, $) {
  const name = $(repo).find('h3').text().trim().replace(/ /g, '');
  return {
    name,
    url: `https://github.com/${name}`,
    description: $(repo).find('p', '.py-1').text().trim(),
    language: $(repo).find('[itemprop=programmingLanguage]').text().trim(),
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
