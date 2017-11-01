
// see: https://github.com/ecrmnn/trending-github/blob/master/src/index.js

const fetch = require('node-fetch');
const cheerio = require('cheerio');

const TOKEN = '7522ae347a86e162cb8cf29473c3f524313597b3';
const url = 'https://github.com/trending/javascript';

async function fetchTrending() {
  const body = await fetch(url).then(r => r.text());
  const $ = cheerio.load(body);
  const repos = [];

  $('li', 'ol.repo-list').each((index, repo) => {
    const name = $(repo).find('h3').text().trim().replace(/ /g, '');
    repos.push({
      name,
      url: `https://github.com/${name}`,
      description: $(repo).find('p', '.py-1').text().trim(),
      language: $(repo).find('[itemprop=programmingLanguage]').text().trim(),
      starsToday: parseInt($(repo).find(`.float-sm-right`).text().trim().replace(',', '') || 0),
      stars: parseInt($(repo).find(`[href="/${name}/stargazers"]`).text().trim().replace(',', '') || 0),
      forks: parseInt($(repo).find(`[href="/${name}/network"]`).text().trim().replace(',', '') || 0),
    });
  });

  console.log(repos);
}

async function fetchComments() {
  const comments = await fetch('https://api.github.com/repos/vitalets/react-native-extended-stylesheet/issues/63/comments', {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `token ${TOKEN}`
    }
  })
    .then(r => r.json());
  comments.forEach(c => console.log(c.body));
}

async function fetchIssues() {
  const issues = await fetch('https://api.github.com/repos/vitalets/react-native-extended-stylesheet/issues', {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `token ${TOKEN}`
    }
  })
    .then(r => r.json());
  issues.forEach(issue => console.log(issue.body));
}

// fetchTrending();
//fetchComments();
fetchIssues();


