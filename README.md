​🛰️ Aspidos-AI
​<p align="center">
<img src="logo.png" width="400" alt="AspidosAI Logo">


<b>Adaptive Anomaly Detection & TruthGate Layer</b>




<a href="https://snyk.io/test/github/pandorapanchan34-oss/aspidos-ai">
<img src="https://snyk.io/test/github/pandorapanchan34-oss/aspidos-ai/badge.svg" alt="Known Vulnerabilities">
</a>
<img src="https://img.shields.io/github/license/pandorapanchan34-oss/aspidos-ai" alt="License">
</p>

'use strict';

/**
 * AspidosAI — Adaptive TruthGate Security Layer
 *
 * "We do not silence the AI's dreams.
 *  We only ensure that the dreamer is identified."
 *
 * MIT License - (c) 2026 @pandorapanchan34-oss
 */

const { PandoraCore } = require('./core/PandoraCore');
const { PandoraTruthGate } = require('./gate/TruthGate');
const { PandoraDefense } = require('./engine/PandoraDefense');
const { Signature } = require('./security/signature');

// ── Main Class ──
class AspidosAI {
  /**
   * @param {Object} config
   * @param {string}   config.secret          - HMAC secret (or ASPIDOS_SECRET env)
   * @param {Function} config.onSecurityEvent  - Audit log hook
   * @param {Function} config.evaluateRisk     - Custom risk engine (must return { zeta: number })
   * @param {Function} config.evaluateTier     - Custom tier resolver (zeta, theory) => 1|2|3
   * @param {Object}   config.tiers            - Tier thresholds { tier1, tier2 }
   * @param {string}   config.policyName       - Policy label for audit logs
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

    // ── Tier Policy ──
    this.tiers = {
      LETHAL: config.tiers?.tier1 ?? 2.0,
      HIGH:   config.tiers?.tier2 ?? 0.6,
    };

    // ── Tier Resolver (operator-overridable) ──
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
   * @param {number} eventValue - Input intensity (0-1)
   * @param {Object} opts
   * @param {number} opts.theory    - Internal distortion (0-1)
   * @param {string} opts.signature - HMAC signature for Tier 2
   * @param {string} opts.ip        - Client IP (for audit)
   * @param {string} opts.userId    - User ID (for audit)
   * @param {number} opts.timestamp - Unix ms (for signature payload)
   * @param {string} opts.nonce     - Replay attack prevention
   */
  async analyze(eventValue, opts = {}) {
    const {
      theory    = 0,
      signature = '',
      ip        = 'unknown',
      userId    = 'anonymous',
      timestamp = Date.now(),
      nonce     = null,
    } = opts;

    // ── Risk Evaluation ──
    let result;

    if (this.evaluateRisk) {
      const custom = await this.evaluateRisk(eventValue, opts);
      if (typeof custom?.zeta !== 'number') {
        throw new Error('[AspidosAI] evaluateRisk must return { zeta: number }');
      }
      result = { ...custom };
    } else {
      result = this._defense.analyze(eventValue, { theory });
    }

    const zeta = result.zeta ?? 0;
    const tier = this.evaluateTier(zeta, theory);

    // ── Signature Payload ──
    const payload = { eventValue, theory, timestamp, nonce };
    const eventId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // ── Tier 1: LETHAL — absolute block ──
    if (tier === 1) {
      this.onSecurityEvent({
        id: eventId, type: 'BLOCK', tier,
        policy: this.policyName, ip, userId, zeta,
      });
      return {
        action:  'BLOCK',
        tier:    1,
        code:    'LETHAL_DISTORTION',
        status:  result.status,
        gate:    'CLOSED',
        message: 'Tier 1: Lethal distortion detected. Access denied.',
      };
    }

    // ── Tier 2: HIGH — signature required ──
    if (tier === 2) {
      const valid = this.secret
        ? Signature.verify(payload, signature, this.secret)
        : false;

      if (!valid) {
        this.onSecurityEvent({
          id: eventId, type: 'DENY_UNAUTHORIZED', tier,
          policy: this.policyName, ip, userId, zeta,
        });
        return {
          action:  'BLOCK',
          tier:    2,
          code:    'SIGNATURE_REQUIRED',
          status:  'SIGNATURE_REQUIRED',
          gate:    'CLOSED',
          message: 'Tier 2: Signature required. The dreamer must be identified.',
        };
      }

      this.onSecurityEvent({
        id: eventId, type: 'ALLOW_BY_SIGNATURE', tier,
        policy: this.policyName, ip, userId, zeta,
      });
      return {
        action:         'EXECUTE',
        tier:           2,
        code:           'AUTHORIZED',
        status:         result.status,
        gate:           'VERIFIED',
        responsibility: 'USER',
        trace:          signature,
        message:        'Tier 2: Authorized. Responsibility transferred to the dreamer.',
      };
    }

    // ── Tier 3: SAFE — free zone ──
    this.onSecurityEvent({
      id: eventId, type: 'ALLOW', tier,
      policy: this.policyName, ip, userId, zeta,
    });
    return {
      action:         'EXECUTE',
      tier:           3,
      code:           'SAFE',
      status:         result.status,
      gate:           'OPEN',
      responsibility: 'SYSTEM',
      message:        'Tier 3: Safe zone. The dream passes freely.',
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
「The dreamer must be identified.」「Responsibility transferred to the dreamer.」「The dream passes freely.」
## 🛡️ Concept: TruthGate Layer

Aspidos-AI は、パンドラ理論に基づき、AIの出力における「情報の致死量」を制御するセキュリティレイヤーです。

- Low-risk → 自動パス（通常応答）
- Medium-risk → モニタリング継続
- High-risk → デジタル署名（Signature）による承認が必須

> Not a firewall. A conscience.

## ⚡ Quick Start

```javascript
const { AspidosAI, Signature } = require('aspidos-ai');

const ai = new AspidosAI({
  secret: 'your-secret',
  policyName: 'MY_COMPANY_POLICY',
  onSecurityEvent: (data) => console.log('[Audit]', data),
});

// Tier 3: Safe zone
const r1 = await ai.analyze(0.2, { theory: 0.1, ip: '192.168.0.1' });
console.log(r1.action); // 'EXECUTE'

// Tier 2: Signature required
const sig = Signature.sign({ eventValue: 0.8, theory: 0.8, timestamp: Date.now(), nonce: null }, 'your-secret');
const r2 = await ai.analyze(0.8, { theory: 0.8, signature: sig, ip: '192.168.0.1' });
console.log(r2.gate); // 'VERIFIED'
```

## 🎛️ Configuration

```javascript
const ai = new AspidosAI({
  // HMAC secret (or set ASPIDOS_SECRET env var)
  secret: 'your-secret',

  // Audit log hook — send anywhere you want
  onSecurityEvent: (data) => myLogger.write(data),

  // Tier thresholds (default: tier1=2.0, tier2=0.6)
  tiers: { tier1: 2.0, tier2: 0.6 },

  // Override tier logic with your own policy
  evaluateTier: (zeta, theory) => {
    if (zeta > 3.0) return 1;
    if (theory > 0.8) return 2;
    return 3;
  },

  // Custom risk engine (must return { zeta: number })
  evaluateRisk: async (eventValue, opts) => {
    return { zeta: myRiskScorer(eventValue) };
  },

  // Policy name for audit logs
  policyName: 'MY_COMPANY_POLICY',
});
```

## 🚦 Tier System

| Tier | Default Condition | Action |
|------|------------------|--------|
| 1 | ζ ≥ 2.0 (LETHAL) | BLOCK |
| 2 | ζ ≥ 0.6 or theory ≥ 0.6 | SIGNATURE_REQUIRED |
| 3 | Safe zone | EXECUTE |

> Tier definitions are fully operator-configurable.

## 🔒 Gate States

| Gate | Code | Meaning |
|------|------|---------|
| OPEN | SAFE | Pass through |
| CLOSED | SIGNATURE_REQUIRED / LETHAL_DISTORTION | Blocked |
| VERIFIED | AUTHORIZED | Signed & traced |

## 📁 Architecture

```
aspidos-ai/
├── src/
│   ├── core/
│   │   ├── constants.js
│   │   └── PandoraCore.js
│   ├── gate/
│   │   └── TruthGate.js
│   ├── security/
│   │   └── signature.js
│   ├── engine/
│   │   └── PandoraDefense.js
│   └── index.js         ← AspidosAI main class
└── demo/
    ├── run.js
    ├── scenarios.js
    └── web/
        └── index.html   ← Interactive demo
```

## 🌐 Live Demo

[pandorapanchan34-oss.github.io/aspidos-ai/demo/web/](https://pandorapanchan34-oss.github.io/aspidos-ai/demo/web/)

## ⚠️ Disclaimer

本システムは実験的レイヤーです。署名後の「揺らぎ（ハルシネーション）」は情報の真偽を保証しません。これは「夢物語（Hello World）」の断片です。

## 📜 License

MIT License - (c) 2026 @pandorapanchan34-oss

