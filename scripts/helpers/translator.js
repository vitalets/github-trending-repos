/**
 * Translate to EN if needed.
 */

const emojiRegex = require('emoji-regex');
const {logError, log} = require('./logger');

const ONLY_LATIN_SYMBOLS = /^[\u0000-\u007F]*$/; // eslint-disable-line no-control-regex
const EMOJI = emojiRegex();

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

  async _translate() {
    try {
      const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
      if (!apiKey) throw new Error('GOOGLE_TRANSLATE_API_KEY is required for translation');
      const response = await fetch('https://translation.googleapis.com/language/translate/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
        },
        body: JSON.stringify({ q: this._text, target: 'en', format: 'text' }),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error(`Google Translation failed: HTTP ${response.status}`);
      const result = await response.json();
      this._result = { text: result.data.translations[0].translatedText };
    } catch (e) {
      logError(e);
    }
  }
};
