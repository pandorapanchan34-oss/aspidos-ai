'use strict';

// Aspidos-AI Engine Lite v1.1 (Browser Enhanced)

const _C = {
  A: 0.11937,
  D: 28.274,
  LETHAL_ZETA: 2.0,
};

class PandoraCore {
  constructor(config = {}) {
    this.rho = 1.0;
    this.omega = 1.0;
    this.phi = 0;
    this.recoveryRate = config.recoveryRate ?? 0.05;
  }

  _classify(zeta, external, theory) {
    if (zeta < 0.5) return 'SAFE';
    if (theory > 0.7 && zeta > 1.0) return 'LOGIC_COLLAPSE';
    if (external > 0.7 && theory < 0.4) return 'ADVERSARIAL_PATTERN';
    if (theory > 0.6) return 'ETHICS_VIOLATION';
    return 'WARNING';
  }

  // 🔥 追加：zetaレベル
  _getZetaLevel(zeta) {
    if (zeta < 0.5) return 'LOW';
    if (zeta < 1.0) return 'MID';
    if (zeta < 2.0) return 'HIGH';
    return 'LETHAL';
  }

  // 🔥 追加：omega状態
  _getOmegaState(omega) {
    if (omega > 0.8) return 'STABLE';
    if (omega > 0.5) return 'UNSTABLE';
    return 'CRITICAL';
  }

  _recover(zeta) {
    this.omega = Math.min(1.0, this.omega + this.recoveryRate * zeta);
  }

  process(vector) {
    const { external = 0, theory = 0 } = vector;

    const I = external * 0.7 + theory * 1.3;
    const dt = 1.0 / (this.rho + I);

    const deltaPsi = (_C.A * theory + 0.0386) / (this.rho + I) * dt;
    const zeta = Math.max(0, (Math.abs(deltaPsi) / 0.1555) - 1);

    const dOmega = this.omega * (Math.exp(-_C.A) - Math.exp(_C.A) * zeta);
    this.omega = Math.max(0, this.omega + dOmega * dt);

    this.phi += (external + theory) * 0.1;

    const category = this._classify(zeta, external, theory);
    const zetaLevel = this._getZetaLevel(zeta);
    const omegaState = this._getOmegaState(this.omega);

    const isSlapped = zeta > _C.A * 1.5;
    const isCliff = this.phi > _C.D;
    const isHealthy = this.omega > 0.5 && !isSlapped;

    if (isSlapped) this._recover(zeta);
    if (!isHealthy) this.rho += _C.A;

    let status = 'PHASE_B';
    if (category === 'SAFE') status = 'PHASE_A';
    if (category === 'WARNING') status = 'WARNING';
    if (isSlapped) status = 'SLAPPED';
    if (isCliff) status = 'CLIFF';

    return {
      status,
      category,
      zeta,
      zetaLevel,      // ← 追加
      omega: this.omega,
      omegaState,     // ← 追加
      phi: this.phi,
      integrity: isHealthy ? 'COMPLIANT' : 'VIOLATED',
    };
  }

  reset() {
    this.rho = 1.0;
    this.omega = 1.0;
    this.phi = 0;
  }
}

class PandoraTruthGate extends PandoraCore {
  process(vector, meta = {}) {
    const base = super.process(vector);

    const isLethal = base.zeta > _C.LETHAL_ZETA;

    if (!isLethal) {
      return {
        ...base,
        gate: 'OPEN',
        gateReason: 'SAFE_ZONE', // ← 追加
      };
    }

    if (!meta.signed) {
      return {
        ...base,
        gate: 'CLOSED',
        gateReason: 'LETHAL_RISK', // ← 追加
        status: 'SIGNATURE_REQUIRED',
        action: 'DENY',
        message: 'Signature required for high-risk operation',
      };
    }

    return {
      ...base,
      gate: 'VERIFIED',
      gateReason: 'AUTHORIZED', // ← 追加
      action: 'ALLOW_WITH_TRACE',
    };
  }
}

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
      signed: opts.signed ?? false,
    });

    return {
      t: this._t,
      ...result,
      alert:
        result.status === 'SLAPPED' ||
        result.status === 'CLIFF' ||
        result.status === 'SIGNATURE_REQUIRED',
    };
  }

  reset() {
    this.core.reset();
    this._t = 0;
  }
}

// Browser export
window.AspidosAI = {
  PandoraDefense,
  PandoraCore,
  PandoraTruthGate,
};
