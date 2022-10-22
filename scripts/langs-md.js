/**
 * Helper script to generate list of supported languages to insert into README.
 * @usage
 * node scripts/langs-md
 */

const R = require('ramda');
const markdownMagic = require('markdown-magic');
const Issues = require('./helpers/issues');

const EXCLUDE = ['all languages', 'unknown languages'];

const config = {
  transforms: {
    LANGS: async () => {
      const issuesDaily = await getIssues('trending-daily');
      const issuesWeekly = await getIssues('trending-weekly');
      const issues = [...issuesDaily, ...issuesWeekly];
      assertAllLocked(issues);
      const langs = R.groupBy(R.prop('lang'), issues);
      return generateMarkdown(langs);
    }
  }
};

markdownMagic('README.md', config);

async function getIssues(label) {
  const isDaily = /daily/i.test(label);
  const issues = await new Issues(label).getAll();
  return issues.map(issue => Object.assign({
    isDaily,
    locked: issue.locked,
    url: issue.html_url,
    lang: Issues.extractLang(issue),
  }));
}

function generateMarkdown(langs) {
  return Object.keys(langs)
    .filter(lang => EXCLUDE.indexOf(lang) === -1)
    .sort()
    .map(lang => generateLangMarkdown(lang, langs[lang]))
    .join('\n');
}

function generateLangMarkdown(lang, items) {
  const links = items.map(({isDaily, url}) => `[${isDaily ? 'daily' : 'weekly'}](${url})`).join(' | ');
  return `* ${lang} (${links})`;
}

function assertAllLocked(issues) {
  const unlocked = issues.filter(issue => !issue.locked);
  if (unlocked.length) {
    unlocked.forEach(issue => console.log(issue, `Unlocked issue: ${issue.url}`));
    throw new Error(`Unlocked issues found!`);
  } else {
    console.log('All issues locked.');
  }
}
