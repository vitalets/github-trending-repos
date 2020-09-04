
const Issues = require('../../scripts/helpers/issues.js');

describe('issues', function () {
  this.timeout(15 * 1000);

  it('should load daily issues', async function () {
    const issues = await new Issues('trending-daily').getAll();
    assert.ok(issues.length > 0);
    assert.isString(issues[0].title);
    assert.isString(issues[0].body);
  });

  it('should load weekly issues', async function () {
    const issues = await new Issues('trending-weekly').getAll();
    assert.ok(issues.length > 0);
    assert.isString(issues[0].title);
    assert.isString(issues[0].body);
  });
});
