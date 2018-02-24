/**
 * Generates list of supported languages to insert into README.
 */

const fetch = require('node-fetch');
const groupBy = require('lodash.groupby');

const API_URL = 'https://api.github.com/repos/vitalets/github-trending-repos';
const EXCLUDE = ['all languages', 'unknown languages'];

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });

async function main() {
  const issuesDaily = await getIssues('trending-daily');
  const issuesWeekly = await getIssues('trending-weekly');
  const langs = groupBy([...issuesDaily, ...issuesWeekly], 'lang');
  const md = getMarkdown(langs);
  console.log(md);
}

async function getIssues(label) {
  const isDaily = /daily/i.test(label);
  const url = `${API_URL}/issues?labels=${label}&per_page=100`;
  const issues = await fetch(url).then(r => r.json());
  return issues.map(({html_url, title}) => Object.assign({
    isDaily,
    url: html_url,
    lang: extractLangFromTitle(title),
  }));
}

function extractLangFromTitle(title) {
  const matches = title.match(/in\s+(.+)$/i);
  if (matches) {
    return matches[1];
  } else {
    throw new Error(`Can't find lang in issue title: ${title}`);
  }
}

function getMarkdown(langs) {
  return Object.keys(langs)
    .filter(lang => EXCLUDE.indexOf(lang) === -1)
    .sort()
    .map(lang => getLangMarkdown(lang, langs[lang]))
    .join('\n');
}

function getLangMarkdown(lang, items) {
  const links = items.map(({isDaily, url}) => `[${isDaily ? 'daily' : 'weekly'}](${url})`).join(' | ');
  return `* ${lang} (${links})`;
}

