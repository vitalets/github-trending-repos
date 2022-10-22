const nodeAssert = require('assert');
const fs = require('fs');
const Trends = require('../../scripts/helpers/trends.js');
const retryOptions = {
  retries: 2,
  minTimeout: 500,
};
describe('trends', function () {

  this.timeout(30 * 1000);

  afterEach(() => {
    sinon.restore();
  });

  it('should load and parse trends', async function () {
    const trendingUrl = 'https://github.com/trending/javascript?since=weekly';
    const repos = await new Trends(trendingUrl, retryOptions).getAll();
    const repo = repos[0];
    assert.equal(repos.length, 25);
    assert.isAbove(repo.name.length, 0, 'name');
    assert.isAbove(repo.url.length, 0, 'url');
    assert.isAbove(repo.description.length, 0, 'description');
    assert.isAbove(repo.starsAdded, 0, 'starsAdded');
    assert.isAbove(repo.stars, 0, 'stars');
    assert.isAbove(repo.forks, 0, 'forks');
    assert.isAbove(repos[0].starsAdded, repos[1].starsAdded);
  });

  it('should retry X times for empty trends', async function () {
    const trendingUrl = 'https://github.com';
    const trends = new Trends(trendingUrl, retryOptions);
    sinon.spy(trends, '_loadRepos');
    sinon.stub(console, 'error');
    await nodeAssert.rejects(trends.getAll(), /Can't find trending repos/);
    sinon.assert.callCount(trends._loadRepos, 3);
    sinon.assert.callCount(console.error, 3);
    assert.include(console.error.firstCall.args[0],
      `Error: Can't find trending repos on page: https://github.com`
    );
  });

  it('should detect GitHub message when there are no trending repos for lang', async function () {
    const file = 'test/data/purescript_daily_no_trending_repos.html';
    const trends = new Trends('', {retries: 0});
    trends._loadHtml = () => trends._html = fs.readFileSync(file, 'utf8');
    const repos = await trends.getAll();
    assert.equal(repos.length, 0);
  });

});
