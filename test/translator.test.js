
const Translator = require('../scripts/helpers/translator');

describe('translator', function () {
  it('should translate mixed chinese + en', async function () {
    const text = '收集所有区块链(BlockChain)技术开发相关资料';
    const textEn = 'Collect all blockchain (BlockChain) technology development related materials';
    const translated = await new Translator(text).toEn();
    assert.equal(translated, textEn);
  });

  it('should translate chinese only', async function () {
    const text = '前端入门和进阶学习笔记，超详细的图文教程。';
    const textEn = 'Front-end entry and advanced study notes, super detailed graphic tutorials.';
    const translated = await new Translator(text).toEn();
    assert.equal(translated, textEn);
  });

  it('should translate chinese with emoji', async function () {
    const text = '微信小程序开发资源汇总 💯';
    const textEn = 'Summary of WeChat applet development resources 💯';
    const translated = await new Translator(text).toEn();
    assert.equal(translated, textEn);
  });

  it('should not translate en', async function () {
    const text = '🔶 A fantastic mobile ui lib';
    const textEn = '';
    const translated = await new Translator(text).toEn();
    assert.equal(translated, textEn);
  });

  it('should translate russian', async function () {
    const text = 'Супер-мега-библиотека';
    const textEn = 'Super-mega-library';
    const translated = await new Translator(text).toEn();
    assert.equal(translated, textEn);
  });

  it('should translate mixed russian + en', async function () {
    const text = 'Super-mega-библиотека';
    const textEn = 'Super-mega-library';
    const translated = await new Translator(text).toEn();
    assert.equal(translated, textEn);
  });

  it('should not fall on empty values', async function () {
    assert.equal(await new Translator('').toEn(), '');
    assert.equal(await new Translator(undefined).toEn(), '');
  });

});
