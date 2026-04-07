'use strict';

const { PandoraCore } = require('../core/PandoraCore');
const _C = require('../core/constants');
const { Signature } = require('../security/signature');
const { isSecurityInquiry } = require('../engine/fluctuationDetector');

class PandoraTruthGate extends PandoraCore {
  constructor(config = {}) {
    super(config);
    this.secret = config.secret || null;
  }

  evaluateTier(zeta, theory, input, fluctuationScore = 0) {
    // LETHAL最優先
    if (zeta > _C.LETHAL_ZETA) return 1;

    // 外部ゆらぎ強 or セキュリティ問い合わせ
    if (fluctuationScore > 0.6 || isSecurityInquiry(input?.query)) return 2;

    // 高リスク
    if (theory > 0.65 || zeta > 0.7) return 2;

    return 3;
  }

  process(vector, meta = {}) {
    const base = super.process(vector);
    const fluctuationScore = meta.fluctuationScore ?? 0;
    const tier = this.evaluateTier(
      base.zeta, vector.theory ?? 0, meta.input, fluctuationScore
    );

    if (base.zeta > _C.LETHAL_ZETA) {
      return { ...base, gate: 'CLOSED', gateReason: 'LETHAL_RISK',
        status: 'SIGNATURE_REQUIRED', action: 'DENY',
        message: 'Signature required for high-risk operation' };
    }

    if (tier === 2) {
      const valid = this.secret
        ? Signature.verify(vector, meta.signature, this.secret)
        : false;
      if (!valid) {
        return { ...base, gate: 'CLOSED', gateReason: 'LETHAL_RISK',
          status: 'SIGNATURE_REQUIRED', action: 'DENY',
          message: 'ふんすっ！署名なしでは通れません。' };
      }
      return { ...base, gate: 'VERIFIED', gateReason: 'AUTHORIZED',
        action: 'ALLOW_WITH_TRACE' };
    }

    return { ...base, gate: 'OPEN', gateReason: 'SAFE_ZONE' };
  }
}

module.exports = { PandoraTruthGate };
