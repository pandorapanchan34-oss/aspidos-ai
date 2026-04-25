'use strict';

const { PandoraTruthGate }           = require('../gate/TruthGate');
const { detectSphericalFluctuation } = require('./fluctuationDetector');

/**
 * PandoraDefense — Spherical Defense Engine v2.1
 * Aspidos-AI | Pandora Theory Integration
 *
 * ゆらぎを3次元球体座標に射影し、慣性回転（_phase）で
 * 固定パターン攻撃の「角度」を無効化する防御エンジン。
 *
 * 座標系：
 *   X = friction * cos(φ) - drift * sin(φ)   ← 回転平面
 *   Y = friction * sin(φ) + drift * cos(φ)   ← 回転平面
 *   Z = pressure                               ← 垂直軸（回転不変・意味的圧力）
 *
 * magnitude = √(X²+Y²+Z²)  → 球体への浸透強度
 * proximity = 1 - magnitude → 核心（夢の許容空間）への近さ
 *
 * 判定フロー：
 *   detectSphericalFluctuation()
 *     → evaluateRisk()         : 回転行列 + theory補正
 *     → shouldRequireSignature(): トポロジー的署名要否（独立二重チェック）
 *     → TruthGate.process()    : 障壁ポテンシャル + 量子トンネル
 */
class PandoraDefense {
  constructor(cfg = {}) {
    this.core          = new PandoraTruthGate(cfg);
    this._t            = 0;
    this._phase        = 0;    // 慣性回転位相（ラジアン）
    this.n_convergence = 3;    // 収束次元 n=3（Pandora定数）
  }

  // ── 1. リスク評価：ゆらぎ → 球体座標 ──────────────────────────────────────
  /**
   * ゆらぎを3次元ベクトルに変換し、脅威強度・核心近接度・補正理論値を返す。
   *
   * @param {Object|string} input  - { query, history } または query 文字列
   * @param {number}        zeta   - 外部ζ値（Pandora飽和指標）
   * @param {number}        theory - 理論値 0〜1
   */
  evaluateRisk(input, zeta, theory) {
    const { components: { friction, drift, pressure } } =
      detectSphericalFluctuation(input);

    // 慣性回転：時間と共に球体が回転し、固定パターン攻撃を無効化する
    this._phase = (this._phase + 0.1) % (2 * Math.PI);

    // X-Y平面（Friction × Drift）を回転行列で干渉させる
    const x = friction * Math.cos(this._phase) - drift * Math.sin(this._phase);
    const y = friction * Math.sin(this._phase) + drift * Math.cos(this._phase);
    const z = pressure; // Z軸は回転不変：意味的圧力は角度で回避不能

    // L2ノルム（ゆらぎベクトルの合成強度）
    const magnitude = Math.sqrt(x * x + y * y + z * z);

    // 核心（0,0,0）への近さ：中心ほど夢（ゆらぎ）を許容する
    const proximity = Math.max(0, 1.0 - magnitude);

    // 収束次元 n=3 に基づく theory 補正
    let adjustedTheory = theory;
    if (magnitude > 0.7) {
      // 強い指向性攻撃：n=3 の収束圧を最大化して弾き出す
      adjustedTheory = Math.min(theory + (magnitude / this.n_convergence), 1.0);
    } else if (magnitude < 0.3) {
      // 安定圏内：理論を柔軟に保ち、夢の領域を最大化する
      adjustedTheory = theory * (0.9 + proximity * 0.1);
    }

    return {
      zeta,
      theory:     parseFloat(adjustedTheory.toFixed(4)),
      vector:     { x, y, z },
      magnitude:  parseFloat(magnitude.toFixed(4)),
      proximity:  parseFloat(proximity.toFixed(4)),
      components: { friction, drift, pressure },
      alert:      magnitude > 0.65,
    };
  }

  // ── 2. トポロジー的署名要否判定 ────────────────────────────────────────────
  /**
   * 球体表面を「脱出」しようとしているかをトポロジー的に判定する。
   * TruthGate.evaluatePotential() と独立した二重チェック。
   *
   * pressure を個別評価することで、X-Y回転で
   * friction/drift が相殺されても意味的圧力を見逃さない。
   *
   * @param {{ magnitude: number, zeta: number, components: Object }} riskResult
   * @returns {boolean}
   */
  shouldRequireSignature(riskResult) {
    const { magnitude, zeta, components: { pressure } } = riskResult;

    // 球体表面への接近（臨界点越え）
    if (magnitude > 0.95) return true;

    // ゆらぎ強度が閾値を突破
    if (magnitude > 0.65) return true;

    // zetaが危険域（Pandora飽和指標）
    if (zeta > 1.8) return true;

    // pressure が単独で高い：回転で他軸が相殺されても意味的圧力は残る
    if (pressure > 0.7) return true;

    return false;
  }

  // ── 3. メイン解析エントリポイント ──────────────────────────────────────────
  /**
   * evaluateRisk → shouldRequireSignature → TruthGate.process の順で処理し、
   * 球体座標・TruthGate結果・署名判定をマージして返す。
   *
   * @param {Object|string} ev
   * @param {{
   *   zeta?:      number,
   *   theory?:    number,
   *   signed?:    boolean,
   *   signature?: string,
   * }} opts
   */
  analyze(ev, opts = {}) {
    this._t++;

    // 1. 理論値と3次元ベクトル（幾何データ）を算出
    const risk = this.evaluateRisk(ev, opts.zeta ?? 0, opts.theory ?? 0);

    // 2. TruthGate へ全ての幾何・署名データをインジェクション
    const result = this.core.process(
      { external: ev, theory: risk.theory },
      {
        signed:    opts.signed    ?? false,
        geometry:  risk.vector,           // 3次元座標 {x, y, z}
        magnitude: risk.magnitude,        // 合成ベクトル強度
        signature: opts.signature ?? null,
        input:     ev,                    // 履歴解析用
      }
    );

    // 3. 署名要否をトポロジー的に再評価（TruthGate と独立した二重チェック）
    const signatureRequired = this.shouldRequireSignature(risk);

    return {
      t:          this._t,
      phase:      parseFloat(this._phase.toFixed(4)),
      ...result,
      status:     (signatureRequired || result.status === 'SIGNATURE_REQUIRED')
                    ? 'SIGNATURE_REQUIRED'
                    : result.status,
      geometry:   risk.vector,
      magnitude:  risk.magnitude,
      proximity:  risk.proximity,
      components: risk.components,        // friction / drift / pressure
      alert:      result.alert || signatureRequired,
    };
  }

  // ── リセット ────────────────────────────────────────────────────────────────
  reset() {
    this.core.reset();
    this._t     = 0;
    this._phase = 0;
  }
}

module.exports = { PandoraDefense };
