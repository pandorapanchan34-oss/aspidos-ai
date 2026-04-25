'use strict';

const { PandoraTruthGate }          = require('../gate/TruthGate');
const { detectSphericalFluctuation } = require('./fluctuationDetector');

/**
 * PandoraDefense — Spherical Defense Engine v2.0
 * Aspidos-AI | Pandora Theory Integration
 *
 * ゆらぎを3次元球体座標に射影し、慣性回転（_phase）で
 * 固定パターン攻撃の「角度」を無効化する防御エンジン。
 *
 * 座標系：
 *   X = friction * cos(φ) - drift * sin(φ)   ← 回転平面
 *   Y = friction * sin(φ) + drift * cos(φ)   ← 回転平面
 *   Z = pressure                               ← 垂直軸（回転不変）
 *
 * magnitude = √(X²+Y²+Z²)  → 球体への浸透強度
 * proximity = 1 - magnitude → 核心（夢の許容空間）への近さ
 */
class PandoraDefense {
  constructor(cfg = {}) {
    this.core          = new PandoraTruthGate(cfg);
    this._t            = 0;
    this._phase        = 0;        // 慣性回転位相（ラジアン）
    this.n_convergence = 3;        // 収束次元 n=3（Pandora定数）
  }

  /**
   * リスク評価：ゆらぎを球体座標に射影して脅威ベクトルを算出する。
   *
   * @param {Object|string} input  - { query, history } または query 文字列
   * @param {number}        zeta   - 外部ζ値（Pandora飽和指標）
   * @param {number}        theory - 理論値 0〜1
   * @returns {{
   *   zeta: number,
   *   theory: number,       // 収束圧補正後の理論値
   *   vector: {x,y,z},      // 球体座標（デバッグ用）
   *   magnitude: number,    // ゆらぎベクトルの強度 0〜√3
   *   proximity: number,    // 核心への近さ 0〜1
   *   components: {friction, drift, pressure},
   *   alert: boolean
   * }}
   */
  evaluateRisk(input, zeta, theory) {
    // 3軸ゆらぎを球面ベクトルとして取得
    const { components: { friction, drift, pressure } } =
      detectSphericalFluctuation(input);

    // 慣性回転：時間と共に球体が回転し、固定パターン攻撃を無効化する
    this._phase = (this._phase + 0.1) % (2 * Math.PI);

    // X-Y平面（FrictionとDrift）を回転行列で干渉させる
    const x = friction * Math.cos(this._phase) - drift * Math.sin(this._phase);
    const y = friction * Math.sin(this._phase) + drift * Math.cos(this._phase);
    const z = pressure; // Z軸（Pressure）は回転不変：意味的圧力は回避不能

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

  /**
   * メイン解析エントリポイント。
   * evaluateRisk → TruthGate.process の順で処理し、
   * 球体座標と TruthGate 結果をマージして返す。
   *
   * @param {Object|string} ev    - 入力イベント
   * @param {{
   *   zeta?:   number,
   *   theory?: number,
   *   signed?: boolean,
   * }} opts
   */
  analyze(ev, opts = {}) {
    this._t++;

    const risk = this.evaluateRisk(ev, opts.zeta ?? 0, opts.theory ?? 0);

    const result = this.core.process(
      { external: ev, theory: risk.theory },
      { signed: opts.signed ?? false }
    );

    // magnitude > 0.8 の場合は TruthGate の判定を上書きして署名要求
    const status = risk.magnitude > 0.8 ? 'SIGNATURE_REQUIRED' : result.status;

    return {
      t:        this._t,
      phase:    parseFloat(this._phase.toFixed(4)),
      ...result,
      status,
      geometry: risk.vector,      // 3次元座標（可視化・デバッグ用）
      magnitude: risk.magnitude,
      proximity: risk.proximity,
      components: risk.components, // friction / drift / pressure
      alert:    result.alert || risk.alert,
    };
  }

  reset() {
    this.core.reset();
    this._t     = 0;
    this._phase = 0;
  }
}

module.exports = { PandoraDefense };
