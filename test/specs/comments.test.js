
const githubApi = require('../../scripts/helpers/github-api.js');
const Comments = require('../../scripts/helpers/comments.js');
const { stripMentionsFromRepoDesc } = require('../../scripts/helpers/issue-updater.js');

describe('comments', function () {

  this.timeout(15 * 1000);

  afterEach(() => sinon.restore());

  it('should load comments from all pages', async function () {
    const comments = await new Comments({number: 5}).getAll();
    assert.ok(comments.length > 0);
    assert.isString(comments[0].body);
  });

  it('should post and delete comment', async function () {
    const body = '**test comment body**';
    const comment = {
      id: 123,
      url: 'https://api.github.com/repos/vitalets/github-trending-repos/issues/comments/123',
      body,
    };
    const fetchJson = sinon.stub(githubApi, 'fetchJson');
    fetchJson.onFirstCall().resolves({result: comment});
    fetchJson.onSecondCall().resolves({result: undefined});

    const comments = new Comments({number: 2});
    assert.deepEqual(await comments.post(body), comment);
    await comments.delete(comment);

    sinon.assert.calledTwice(fetchJson);
    sinon.assert.calledWithExactly(fetchJson.firstCall, 'post', 'issues/2/comments', {body});
    sinon.assert.calledWithExactly(fetchJson.secondCall, 'delete', comment.url);
  });

  it('should strip mentions from repo desc', () => {
    assert.equal(stripMentionsFromRepoDesc('Repo desc [maintainer=@abc]'), 'Repo desc [maintainer=`@abc`]');
    assert.equal(stripMentionsFromRepoDesc('Repo desc 2 @abc,@xx]'), 'Repo desc 2 `@abc`,`@xx`]');
    assert.equal(stripMentionsFromRepoDesc('Repo desc [maintainer=@abc] 11'), 'Repo desc [maintainer=`@abc`] 11');
    assert.equal(stripMentionsFromRepoDesc('Repo desc @user'), 'Repo desc `@user`');
    assert.equal(stripMentionsFromRepoDesc('@user is the maintainer'), '`@user` is the maintainer');
    
    // negative
    assert.equal(stripMentionsFromRepoDesc('email me at user@gmail.com'), 'email me at user@gmail.com');
  });

});
