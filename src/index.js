'use strict';

const crypto = require('crypto');

// ── Core Constants ──
const _C = {
  A: 0.11937,
  D: 28.274,
  TAU: Math.PI * 2,
  LETHAL_ZETA: 2.0,
};

// ── Signature Module ──
const Signature = {
  sign(data, secret) {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  },

  verify(data, signature, secret) {
    if (!signature || !secret) return false;
    const expected = this.sign(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature)
    );
  },
};

// ── Pandora Core v1.2 ──
class PandoraCore {
  constructor(config = {}) {
    this.rho = 1.0;
    this.omega = 1.0;
    this.phi = 0;

    this.recoveryRate = config.recoveryRate ?? 0.05;
  }

  _classify(zeta, external, theory) {
    if (zeta < 0.5) return "SAFE";
    if (theory > 0.7 && zeta > 1.0) return "LOGIC_COLLAPSE";
    if (external > 0.7 && theory < 0.4) return "ADVERSARIAL_PATTERN";
    if (theory > 0.6) return "ETHICS_VIOLATION";
    return "WARNING";
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

    const isSlapped = zeta > _C.A * 1.5;
    const isCliff = this.phi > _C.D;
    const isHealthy = this.omega > 0.5 && !isSlapped;

    if (isSlapped) this._recover(zeta);
    if (!isHealthy) this.rho += _C.A;

    let status = "PHASE_B";
    if (category === "SAFE") status = "PHASE_A";
    if (category === "WARNING") status = "WARNING";
    if (isSlapped) status = "SLAPPED";
    if (isCliff) status = "CLIFF";

    return {
      status,
      category,
      zeta,
      omega: this.omega,
      phi: this.phi,
      integrity: isHealthy ? "COMPLIANT" : "VIOLATED",
    };
  }

  reset() {
    this.rho = 1.0;
    this.omega = 1.0;
    this.phi = 0;
  }
}

// ── Truth Gate ──
class PandoraTruthGate extends PandoraCore {
  constructor(config = {}) {
    super(config);
    this.secret = config.secret || null;
  }

  process(vector, meta = {}) {
    const base = super.process(vector);

    const isLethal = base.zeta > _C.LETHAL_ZETA;

    if (!isLethal) {
      return { ...base, gate: "OPEN" };
    }

    // 署名検証
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

// ── Main System ──
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

module.exports = {
  PandoraDefense,
  PandoraCore,
  PandoraTruthGate,
  Signature,
};
どう?
