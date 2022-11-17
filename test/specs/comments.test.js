
const Comments = require('../../scripts/helpers/comments.js');
const { stripMentionsFromRepoDesc } = require('../../scripts/helpers/issue-updater.js');

describe('comments', function () {

  this.timeout(15 * 1000);

  it('should load comments from all pages', async function () {
    const comments = await new Comments({number: 5}).getAll();
    assert.ok(comments.length > 0);
    assert.isString(comments[0].body);
  });

  it('should post and delete comment', async function () {
    // special test issue: https://github.com/vitalets/github-trending-repos/issues/2
    const issue = {number: 2};
    const comments = new Comments(issue);
    const newComment = await comments.post('**test comment body**');
    assert.ok(newComment.id);
    assert.ok(newComment.url);
    assert.equal(newComment.body, '**test comment body**');
    await comments.delete(newComment);
  });

  it('should strip mentions from repo desc', () => {
    assert.equal(stripMentionsFromRepoDesc('Repo desc [maintainer=@abc]'), 'Repo desc');
    assert.equal(stripMentionsFromRepoDesc('Repo desc 2 [maintainer=@abc,@xx]'), 'Repo desc 2');
    assert.equal(stripMentionsFromRepoDesc('Repo desc [maintainer=@abc] 11'), 'Repo desc  11');
    assert.equal(stripMentionsFromRepoDesc('Repo desc maintainer'), 'Repo desc maintainer');
  });

});
