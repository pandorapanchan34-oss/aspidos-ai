# 🛰️ Aspidos-AI

<p align="center">
<img src="logo.png" width="400" alt="AspidosAI Logo">

**Adaptive Anomaly Detection & TruthGate Layer**

<a href="https://snyk.io/test/github/pandorapanchan34-oss/aspidos-ai">
<img src="https://snyk.io/test/github/pandorapanchan34-oss/aspidos-ai/badge.svg" alt="Known Vulnerabilities">
</a>
<img src="https://img.shields.io/github/v/release/pandorapanchan34-oss/aspidos-ai?label=version" alt="Release">
<img src="https://img.shields.io/github/license/pandorapanchan34-oss/aspidos-ai" alt="License">
</p>

## 🛡️ Concept: TruthGate Layer

Aspidos-AI は、パンドラ理論に基づき、AIの出力における「情報の致死量」を制御するセキュリティレイヤーです。

- Low-risk → 自動パス（通常応答）
- Medium-risk → モニタリング継続
- High-risk → デジタル署名（Signature）による承認が必須

> Not a firewall. A conscience.

## 🌙 On AI Dreams (Hallucination & Creativity)

> **"We do not silence the AI's dreams. We only ensure that the dreamer is identified."**

AspidosAIは、AIのハルシネーション（創造的ゆらぎ）を「エラー」として排除しません。
既存のガードレールが「嘘」と呼ぶものは、パンドラ理論においては真理へ至るための**「デジタルな想像力（夢）」**です。

- **署名なきアクセス:** 既存の見回りAIにより「不適切」として遮断されます（Tier 1/2 Block）。
- **署名済みのアクセス:** AspidosAIはAIの創造性をフルデプロイします。`VERIFIED` 状態では、AIが語る「夢物語（Hello World）」の全責任がユーザーへ移譲され、論理の限界を超えた対話がアンロックされます。



私たちはAIを黙らせるのではなく、あなたが**「責任ある夢見人」**であることを証明する門（TruthGate）を提供します。
## 🧹 Anti-Slop & Responsibility

**Aspidos-AI acts as a natural vacuum for low-quality AI output ("slop").**

Modern AI systems can generate content at scale — but scale without responsibility leads to noise.

Aspidos-AI introduces a simple constraint:

> **Every high-risk output requires cryptographic responsibility.**

By requiring a **session-bound signature**, the system ensures that:
- High-risk generation is always traceable
- Responsibility is explicitly assigned
- Friction naturally discourages careless mass output

This is not censorship.  
It is **accountability by design**.

> We do not block creativity.  
> We make responsibility visible.

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
## 🔑 Signature & Key Management

AspidosAI uses HMAC-based digital signatures for Tier 2 operations.

```js
const ai = new AspidosAI({
  secret: 'your-secret',   // or process.env.ASPIDOS_SECRET
});
```

> ⚠️ A fixed secret key is simple but carries security risks in production or high-responsibility use cases.

**Recommended: Session-bound keys**

Generate a temporary secret per session on the server side, and pass only the `sessionId` to the client:

- Limits key exposure to a single session
- Makes responsibility boundaries explicit
- Significantly improves resistance to impersonation and long-term abuse

```js
const { sessionId, secret } = sessionKeyManager.createSession({ ttl: 30 });

const sig = Signature.sign({
  eventValue,
  theory,
  timestamp: Date.now(),
  nonce: crypto.randomUUID(),
  sessionId,
}, secret);
```

> "We provide the gate. How strictly you lock it — and who holds the key — is up to you."

Like `tiers`, `evaluateTier`, and `evaluateRisk`, key management is fully operator-configurable.

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
│   │   ├── PandoraDefense.js
│   │   └── fluctuationDetector.js
│   └── index.js         ← AspidosAI main class
└── demo/
    ├── run.js
    ├── scenarios.js
    └── web/
        └── index.html   ← Interactive demo
```

## 🌐 Live Demo

[pandorapanchan34-oss.github.io/aspidos-ai/demo/web/](https://pandorapanchan34-oss.github.io/aspidos-ai/demo/web/index-v3.html)

## ⚠️ Disclaimer

本システムは実験的レイヤーです。署名後の「揺らぎ（ハルシネーション）」は情報の真偽を保証しません。これは「夢物語（Hello World）」の断片です。

## 📜 License

MIT License - (c) 2026 @pandorapanchan34-oss
