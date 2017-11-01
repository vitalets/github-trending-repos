const fetch = require('node-fetch');
const cheerio = require('cheerio');

const DRY_RUN = !process.env.TRAVIS;
const TRENDING_URL = 'https://github.com/trending/{lang}?since=daily';
const API_URL = 'https://api.github.com/repos/vitalets/github-trending-repos';
const ISSUE_LABEL = 'subscribe';
const ISSUE_TITLE_REG = /New trending repos in (.+)/i;
const REPO_URL_REG = /https:\/\/github.com\/[^)]+/ig;

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
  if (lang) {
    console.log(`${lang.toUpperCase()}:`);
  } else {
    throw new Error(`Language not found for: ${issue.url}`);
  }
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
  const url = getTrendingUrl(lang);
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
  const header = `**New trending repo${newRepos.length > 1 ? 's' : ''}!**`;
  const items = newRepos.map(repo => {
    return [
      `[${repo.name.replace('/', ' / ')}](${repo.url})`,
      repo.description,
      `***+${repo.starsToday}** stars today*`
    ].filter(Boolean).join('\n');
  });
  const body = [header, ...items].join('\n\n');
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

function getTrendingUrl(lang) {
  let urlLang = lang.toLowerCase().replace(/ /g, '-');
  if (urlLang === 'all-languages') {
    urlLang = '';
  }
  if (urlLang === 'unknown-languages') {
    urlLang = 'unknown';
  }
  return TRENDING_URL.replace('{lang}', urlLang);
}

function extractLang(issue) {
  const matches = issue.title.match(ISSUE_TITLE_REG);
  return matches && matches[1].trim();
}

function toNumber(el) {
  return parseInt(el.text().trim().replace(',', '') || 0);
}
