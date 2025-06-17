// utils/tokenizer.js
// --------------------------------------------------
// Simple tokenisation helper for PII masking / lookup
// --------------------------------------------------

const { v4: uuidv4 } = require('uuid');

class Tokenizer {
  constructor() {
    this.tokenMap = {};      // token → real value
  }

  /**
   * Stores a value and returns a unique token handle.
   * @param {string} realValue  Raw PII string
   * @returns {string} token    e.g. "__tok_7f1d4…"
   */
  createToken(realValue) {
    const token = `__tok_${uuidv4()}`;
    this.tokenMap[token] = realValue;
    return token;
  }

  /**
   * Looks up a token and returns the real value.
   * @param {string} token
   * @returns {string|undefined}
   */
  resolveToken(token) {
    return this.tokenMap[token];
  }

  /**
   * Serialises map for persisting / audit logging.
   */
  toJSON() {
    return JSON.stringify(this.tokenMap, null, 2);
  }
}

module.exports = new Tokenizer();
