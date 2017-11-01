
const fetch = require('node-fetch');
const cheerio = require('cheerio');

const DRY_RUN = !process.env.TRAVIS;
const TRENDING_URL = 'https://github.com/trending/{lang}?since=daily';
const API_URL = 'https://api.github.com/repos/vitalets/github-trending-repos';
const ISSUE_LABEL = 'subscribe';
const REPO_URL_REG = /https:\/\/github.com\/[^)]+/ig;
const COMMENT_TPL = `
**New trending repo:** [{name}]({url})
**Description:** {description}
**Stars today:** {starsToday}
`.trim();

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });

async function main() {
  const issues = await getIssues();
  console.log(`Fetched issues: ${issues.length}`);
  for (let issue of issues) {
    await processIssue(issue);
  }
}

async function getIssues() {
  return await fetchJson(`get`, `issues?labels=${ISSUE_LABEL}`);
}

async function processIssue(issue) {
  const lang = extractLang(issue);
  console.log(lang.toUpperCase());
  const trendingRepos = await getTrendingRepos(lang);
  console.log(`Trending repos: ${trendingRepos.size}`);
  if (trendingRepos.size === 0) {
    throw new Error(`0 trending repos for ${lang}`);
  }
  const knownRepos = await getKnownRepos(issue);
  console.log(`Known repos: ${knownRepos.size}`);
  const newRepos = filterNewRepos(trendingRepos, knownRepos);
  console.log(`New repos: ${newRepos.length}`);
  if (newRepos.length) {
    await postComment(issue, newRepos);
  }
}

async function getTrendingRepos(lang) {
  const url = TRENDING_URL.replace('{lang}', lang.toLowerCase());
  console.log(`Fetching trending repos for ${lang}: ${url}`);
  const body = await fetch(url).then(r => r.text());
  const $ = cheerio.load(body);
  const repos = new Map();
  $('li', 'ol.repo-list').each((index, repo) => {
    const name = $(repo).find('h3').text().trim().replace(/ /g, '');
    const info = {
      name,
      url: `https://github.com/${name}`,
      description: $(repo).find('p', '.py-1').text().trim(),
      language: $(repo).find('[itemprop=programmingLanguage]').text().trim(),
      starsToday: toNumber($(repo).find(`.float-sm-right`)),
      stars: toNumber($(repo).find(`[href="/${name}/stargazers"]`)),
      forks: toNumber($(repo).find(`[href="/${name}/network"]`)),
    };
    repos.set(name, info);
  });
  return repos;
}

async function getKnownRepos(issue) {
  const comments = await fetchJson(`get`, `issues/${issue.number}/comments`);
  const repos = new Set();
  comments.forEach(comment => {
    const names = comment.body.match(REPO_URL_REG);
    if (names) {
      names.forEach(name => repos.add(name));
    }
  });
  return repos;
}

function filterNewRepos(trendingRepos, knownRepos) {
  const result = [];
  for (let trendingRepo of trendingRepos.values()) {
    if (!knownRepos.has(trendingRepo.url)) {
      result.push(trendingRepo);
    }
  }
  return result;
}

async function postComment(issue, newRepos) {
  const body = newRepos.map(repo => {
    return COMMENT_TPL
      .replace('{name}', repo.name.replace('/', ' / '))
      .replace('{url}', repo.url)
      .replace('{description}', repo.description || '*none*')
      .replace('{starsToday}', repo.starsToday);
  }).join('\n\n');
  if (DRY_RUN) {
    console.log(`[DRY_RUN]: will comment\n${body}`);
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
  const response = await fetch(url, {
    method,
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': `token ${process.env.GITHUB_TOKEN}`
    },
    body: JSON.stringify(data)
  });
  return await response.json();
}

function extractLang(issue) {
  return issue.title.split(' ').pop();
}

function toNumber(el) {
  return parseInt(el.text().trim().replace(',', '') || 0);
}
