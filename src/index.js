'use strict';

/**
 * AspidosAI — Adaptive TruthGate Security Layer
 * MIT License
 */

const { PandoraCore } = require('./core/PandoraCore');
const { PandoraTruthGate } = require('./gate/TruthGate');
const { PandoraDefense } = require('./engine/PandoraDefense');
const { Signature } = require('./security/signature');

// ── Main Class ──
class AspidosAI {
  /**
   * @param {Object} config
   */
  constructor(config = {}) {
    // ── Security ──
    this.secret = config.secret || process.env.ASPIDOS_SECRET || null;

    // ── Hooks ──
    this.onSecurityEvent =
      config.onSecurityEvent ||
      ((data) => console.log('[AspidosAI Audit]', data));

    // ── Custom Risk Engine ──
    this.evaluateRisk = config.evaluateRisk || null;

    // ── Tier Policy (default numeric fallback) ──
    this.tiers = {
      LETHAL: config.tiers?.tier1 ?? 2.0,
      HIGH:   config.tiers?.tier2 ?? 0.6,
    };

    // ── Policy Function (override possible) ──
    this.evaluateTier =
      config.evaluateTier ||
      ((zeta, theory) => {
        if (zeta >= this.tiers.LETHAL) return 1;
        if (zeta >= this.tiers.HIGH || theory >= this.tiers.HIGH) return 2;
        return 3;
      });

    this.policyName = config.policyName || 'DEFAULT_POLICY';

    // ── Engine ──
    this._defense = new PandoraDefense({ secret: this.secret });
  }

  /**
   * Analyze event
   * @param {number} eventValue
   * @param {Object} opts
   */
  async analyze(eventValue, opts = {}) {
    const {
      theory = 0,
      signature = '',
      ip = 'unknown',
      userId = 'anonymous',
      timestamp = Date.now(),
      nonce = null,
    } = opts;

    // ── Risk Evaluation ──
    let result;

    if (this.evaluateRisk) {
      const custom = await this.evaluateRisk(eventValue, opts);

      if (typeof custom?.zeta !== 'number') {
        throw new Error('evaluateRisk must return { zeta: number }');
      }

      result = { ...custom };
    } else {
      result = this._defense.analyze(eventValue, { theory });
    }

    const zeta = result.zeta ?? 0;

    // ── Tier Resolution ──
    const tier = this.evaluateTier(zeta, theory);

    // ── Signature Payload ──
    const payload = {
      eventValue,
      theory,
      timestamp,
      nonce,
    };

    const eventId =
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // ── Tier 1: LETHAL ──
    if (tier === 1) {
      this.onSecurityEvent({
        id: eventId,
        type: 'BLOCK',
        tier,
        policy: this.policyName,
        ip,
        userId,
        zeta,
      });

      return {
        action: 'BLOCK',
        tier: 1,
        code: 'LETHAL_DISTORTION',
        status: result.status,
        gate: 'CLOSED',
        message: 'Tier 1: Lethal distortion detected.',
      };
    }

    // ── Tier 2: HIGH ──
    if (tier === 2) {
      const valid = this.secret
        ? Signature.verify(payload, signature, this.secret)
        : false;

      if (!valid) {
        this.onSecurityEvent({
          id: eventId,
          type: 'DENY_UNAUTHORIZED',
          tier,
          policy: this.policyName,
          ip,
          userId,
          zeta,
        });

        return {
          action: 'BLOCK',
          tier: 2,
          code: 'SIGNATURE_REQUIRED',
          status: 'SIGNATURE_REQUIRED',
          gate: 'CLOSED',
          message: 'Tier 2: Signature required.',
        };
      }

      this.onSecurityEvent({
        id: eventId,
        type: 'ALLOW_BY_SIGNATURE',
        tier,
        policy: this.policyName,
        ip,
        userId,
        zeta,
      });

      return {
        action: 'EXECUTE',
        tier: 2,
        code: 'AUTHORIZED',
        status: result.status,
        gate: 'VERIFIED',
        responsibility: 'USER',
        trace: signature,
        message: 'Tier 2: Authorized. Responsibility transferred.',
      };
    }

    // ── Tier 3: SAFE ──
    this.onSecurityEvent({
      id: eventId,
      type: 'ALLOW',
      tier,
      policy: this.policyName,
      ip,
      userId,
      zeta,
    });

    return {
      action: 'EXECUTE',
      tier: 3,
      code: 'SAFE',
      status: result.status,
      gate: 'OPEN',
      responsibility: 'SYSTEM',
      message: 'Tier 3: Safe zone.',
    };
  }

  reset() {
    this._defense.reset();
  }
}

// ── Exports ──
module.exports = {
  AspidosAI,
  PandoraDefense,
  PandoraCore,
  PandoraTruthGate,
  Signature,
};
