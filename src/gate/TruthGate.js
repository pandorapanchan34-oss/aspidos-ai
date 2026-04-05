'use strict';

const { PandoraCore } = require('../core/PandoraCore');
const _C = require('../core/constants');
const { Signature } = require('../security/signature');

class PandoraTruthGate extends PandoraCore {
  constructor(config = {}) {
    super(config);
    this.secret = config.secret || null;
  }

  process(vector, meta = {}) {
    const base = super.process(vector);
    const zeta = base.zeta ?? 0;

    const isLethal = zeta > _C.LETHAL_ZETA;

    if (!isLethal) {
      return { ...base, gate: "OPEN" };
    }

    const valid = Signature.verify(vector, meta.signature, this.secret);

    if (!valid) {
      return {
        ...base,
        gate: "CLOSED",
        status: "SIGNATURE_REQUIRED",
        action: "DENY",
        message: "Signature required for high-risk operation",
      };
    }

    return {
      ...base,
      gate: "VERIFIED",
      action: "ALLOW_WITH_TRACE",
    };
  }
}

module.exports = { PandoraTruthGate };
