const Translator = require('../../scripts/helpers/translator.js');

describe('translator', function () {
  // Allow the API's 15-second request timeout to finish before Mocha times out.
  this.timeout(20000);

  it('should translate mixed chinese + en', async function () {
    const text = '收集所有区块链(BlockChain)技术开发相关资料';
    const translated = await new Translator(text).toEn();
    assert.isString(translated);
    assert.include(translated.toLowerCase(), 'blockchain');
    assert.include(translated.toLowerCase(), 'development');
  });

  it('should translate chinese with emoji', async function () {
    const text = '微信小程序开发资源汇总 💯';
    const translated = await new Translator(text).toEn();
    assert.isString(translated);
    assert.include(translated.toLowerCase(), 'program development resources');
    assert.include(translated, '💯');
  });

  it('should not translate en', async function () {
    const text = '🔶 A fantastic mobile ui lib';
    const textEn = '';
    const translated = await new Translator(text).toEn();
    assert.equal(translated, textEn);
  });

  it('should not fall on empty values', async function () {
    assert.equal(await new Translator('').toEn(), '');
    assert.equal(await new Translator(undefined).toEn(), '');
  });

});
