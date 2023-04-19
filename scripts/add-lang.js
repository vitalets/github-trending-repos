/**
 * Helper script to generate markdown for creating new lang issues.
 * @usage
 * node scripts/add-lang <lang> <?langForUrl>
 *
 * @example
 * node scripts/add-lang JavaScript
 * node scripts/add-lang "1C Enterprise" 1c-enterprise
 */
const qs = require('querystring');
const readline = require('readline');
const lang = process.argv[2];
const langInUrl = process.argv[3] || lang.toLowerCase();
const rl = readline.createInterface({input: process.stdin,  output: process.stdout});

const NEW_ISSUE_URL = 'https://github.com/owen800q/github-trending-repos/issues/new';

generateIssueData('daily');
rl.question('Press any key to generate weekly:', () => {
  generateIssueData('weekly');
  rl.close();
});

function generateIssueData(schedule) {
  const title = `New ${schedule} trending repos in ${lang}`;
  const url = `https://github.com/trending/${qs.escape(langInUrl)}?since=${schedule}`;
  const body = `Subscribe to this issue and stay notified about new [${schedule} trending repos in ${lang}](${url}).`;
  const label = `trending-${schedule}`;
  const finalUrl = `${NEW_ISSUE_URL}?title=${qs.escape(title)}&body=${qs.escape(body)}&labels=${label}`;
  console.log(`Copy-paste this url to create issue (${schedule}):`.toUpperCase());
  console.log(`${finalUrl}`);
  console.log(`\nDon't forget to:`);
  console.log(`1. lock conversation`);
  console.log(`2. add to readme`);
}

/*
Done in #110 (daily), #111 (weekly).
The first comment will contain all currently trending repos, and all following comments will contain only updates.
*/
