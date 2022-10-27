/**
 * Translate to EN if needed.
 */

const { translate } = require('@vitalets/google-translate-api');
const emojiRegex = require('emoji-regex');
const {logError, log} = require('./logger');

const ONLY_LATIN_SYMBOLS = /^[\u0000-\u007F]*$/; // eslint-disable-line no-control-regex
const EMOJI = emojiRegex();
const GOOGLE_TRANSLATE_PROXY_HOST = process.env.GOOGLE_TRANSLATE_PROXY_HOST;

module.exports = class Translator {
  constructor(text) {
    this._text = text || '';
    this._cleanText = '';
    this._result = null;
  }

  /**
   * Translates to EN if needed.
   *
   * @returns {Promise<String>} returns en-string if translation done and empty string if no translation done.
   */
  async toEn() {
    this._removeEmoji();
    if (this._hasOnlyLatinSymbols()) {
      return '';
    } else {
      log(`Translating: ${this._text}`);
      await this._translate();
      const translatedText = this._result && this._result.text;
      log(`Translated: ${translatedText}`);
      return translatedText !== this._text ? translatedText : '';
    }
  }

  _removeEmoji() {
    this._cleanText = this._text.replace(EMOJI, '');
  }

  _hasOnlyLatinSymbols() {
    return ONLY_LATIN_SYMBOLS.test(this._cleanText);
  }

  async _translate(host = '') {
    try {
      // this._result = await translate(this._text, {to: 'en', client: 'gtx'});
      // new translate using google-translate-api v9
      const options = { to: 'en' };
      if (host) options.host = host;
      this._result = await translate(this._text, options);
    } catch (e) {
      if (!host && e.name === 'TooManyRequestsError' && GOOGLE_TRANSLATE_PROXY_HOST) {
        log(`TooManyRequestsError. Retrying with proxy host...`);
        await this._translate(GOOGLE_TRANSLATE_PROXY_HOST);
      } else {
        logError(e);
      }
    }
  }
};
