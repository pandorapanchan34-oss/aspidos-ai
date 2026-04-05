'use strict';

const { PandoraTruthGate } = require('../gate/TruthGate');

class PandoraDefense {
  constructor(config = {}) {
    this.core = new PandoraTruthGate(config);
    this._t = 0;
  }

  analyze(eventValue, opts = {}) {
    this._t++;

    const vector = {
      external: eventValue,
      theory: opts.theory ?? 0,
    };

    const result = this.core.process(vector, {
      signature: opts.signature,
    });

    return {
      t: this._t,
      ...result,
      alert:
        result.status === "SLAPPED" ||
        result.status === "CLIFF" ||
        result.status === "SIGNATURE_REQUIRED",
    };
  }

  reset() {
    this.core.reset();
    this._t = 0;
  }
}

module.exports = { PandoraDefense };
