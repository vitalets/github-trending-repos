
const Comments = require('../scripts/helpers/comments');

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
});
