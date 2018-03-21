
const Comments = require('../scripts/helpers/comments');

describe('comments', function () {

  this.timeout(15 * 1000);

  it('should load comments from all pages', async function () {
    const comments = await new Comments({number: 5}).getAll();
    assert.ok(comments.length > 0);
    assert.isString(comments[0].body);
  });

  it('should post comment', async function () {
    // #2 - special closed issue
    const comments = new Comments({number: 2});
    const result = await comments.post('**test comment body**');
    assert.ok(result.id);
    assert.equal(result.body, '**test comment body**');
  });
});
