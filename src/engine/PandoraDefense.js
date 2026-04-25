'use strict';

const { PandoraTruthGate } = require('../gate/TruthGate');
const { detectExternalFluctuation } = require('./fluctuationDetector');

class PandoraDefense {
  constructor(cfg = {}) {
    this.core = new PandoraTruthGate(cfg);
    this._t = 0;
    this._phase = 0; // 360度回転軸
    this.n_convergence = 3;
  }

  evaluateRisk(input, zeta, theory) {
    const history = input?.history || [];
    // 3軸のベクトルを個別に取得
    const { friction, drift, pressure } = detectExternalFluctuation(input, history);

    // 慣性回転：時間 t と共に球体が回転し、攻撃の「角度」を無効化する
    this._phase = (this._phase + 0.1) % (2 * Math.PI);

    // X-Y平面（FrictionとDrift）の動的干渉
    const x = friction * Math.cos(this._phase) - drift * Math.sin(this._phase);
    const y = friction * Math.sin(this._phase) + drift * Math.cos(this._phase);
    const z = pressure; // Z軸（Pressure）は中心へ垂直に突き刺さる

    // ベクトルの合成強度（L2ノルム）
    const magnitude = Math.sqrt(x*x + y*y + z*z);
    // 核心（0,0,0）への浸透度
    const proximity = Math.max(0, 1.0 - magnitude);

    // 収束判定ロジックの3次元化
    let adjustedTheory = theory;
    if (magnitude > 0.7) {
      // 強い指向性攻撃に対し、n=3の収束圧を最大化して弾き出す
      adjustedTheory = Math.min(theory + (magnitude / this.n_convergence), 1.0);
    } else if (magnitude < 0.3) {
      // 安定圏内では「夢（ゆらぎ）」を最大化し、理論を柔軟に保つ
      adjustedTheory = theory * (0.9 + proximity * 0.1);
    }

    return {
      zeta,
      theory: adjustedTheory,
      vector: { x, y, z },
      magnitude,
      proximity,
      alert: magnitude > 0.65
    };
  }

  analyze(ev, opts = {}) {
    this._t++;
    const risk = this.evaluateRisk(ev, opts.zeta ?? 0, opts.theory ?? 0);
    
    const result = this.core.process(
      { external: ev, theory: risk.theory },
      { signed: opts.signed ?? false }
    );

    return {
      t: this._t,
      phase: this._phase,
      ...result,
      status: (risk.magnitude > 0.8) ? 'SIGNATURE_REQUIRED' : result.status,
      geometry: risk.vector, // 3次元座標を出力
      alert: result.alert || risk.alert
    };
  }
}

module.exports = { PandoraDefense };
