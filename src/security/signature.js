'use strict';

const crypto = require('crypto');

const Signature = {
  sign(data, secret) {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  },

  verify(data, signature, secret) {
    if (!signature || !secret) return false;

    const expected = this.sign(data, secret);

    try {
      return crypto.timingSafeEqual(
        Buffer.from(expected),
        Buffer.from(signature)
      );
    } catch {
      return false;
    }
  },
};

module.exports = { Signature };
