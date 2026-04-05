'use strict';

const _C = require('./constants');

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
    let status = 'PHASE_B';
    if (category === 'SAFE') status = 'PHASE_A';
    if (category === 'WARNING') status = 'WARNING';
    if (isSlapped) status = 'SLAPPED';
    if (isCliff) status = 'CLIFF';
    return { status, category, zeta, omega: this.omega, phi: this.phi, integrity: isHealthy ? 'COMPLIANT' : 'VIOLATED' };
  }

  reset() { this.rho = 1.0; this.omega = 1.0; this.phi = 0; }
}

module.exports = { PandoraCore };
