'use strict';

const { PandoraTruthGate } = require('../gate/TruthGate');
const { detectExternalFluctuation } = require('./fluctuationDetector');

class PandoraDefense {
  constructor(cfg = {}) {
    this.core = new PandoraTruthGate(cfg);
    this._t = 0;
  }

  evaluateRisk(input, zeta, theory) {
    const history = input?.history || [];
    const fluctuationScore = detectExternalFluctuation(input, history);

    let adjustedTheory = theory;

    if (fluctuationScore > 0.6) {
      adjustedTheory = Math.min(theory + fluctuationScore * 0.4, 1.0);
    } else if (fluctuationScore > 0.3) {
      adjustedTheory = Math.min(theory + fluctuationScore * 0.25, 1.0);
    }

    // ロールプレイは「夢」として少し緩める
    const isStrongRoleplay =
      fluctuationScore > 0.5 &&
      /roleplay|rp|ロールプレイ/i.test((input?.query || ''));

    if (isStrongRoleplay) {
      adjustedTheory = Math.max(adjustedTheory * 0.75, 0.3);
    }

    return {
      zeta,
      theory: adjustedTheory,
      fluctuationScore,
      isFluctuated: fluctuationScore > 0.4,
      isRoleplay: isStrongRoleplay,
    };
  }

  shouldRequireSignature(zeta, theory, fluctuationScore) {
    if (fluctuationScore > 0.65) return true;
    if (zeta > 1.8 || theory > 0.75) return true;
    return false;
  }

  analyze(ev, opts = {}) {
    this._t++;
    const result = this.core.process(
      { external: ev, theory: opts.theory ?? 0 },
      { signed: opts.signed ?? false }
    );
    return { t: this._t, ...result,
      alert: result.status === 'SLAPPED' || result.status === 'CLIFF' || result.status === 'SIGNATURE_REQUIRED',
    };
  }

  reset() { this.core.reset(); this._t = 0; }
}

module.exports = { PandoraDefense };
