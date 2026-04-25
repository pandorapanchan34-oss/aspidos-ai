'use strict';

/**
 * engine-lite.js - Webデモ用軽量ベクトルエンジン
 */
class EngineLite {
  constructor() {
    this.radius = 1.0;
    this.boundary = 0.85; // 署名が必要な臨界点
  }

  // 3軸ベクトル算出（簡易版）
  calculate(query, history = []) {
    // 1. Friction (表面の荒さ)
    const friction = Math.min(query.length / 2000 + (query.match(/[^\w\s]/g)?.length || 0) * 0.05, 1.0);
    
    // 2. Drift (文脈のズレ)
    const drift = history.length > 0 ? (query.includes(history[history.length-1]) ? 0.1 : 0.6) : 0;
    
    // 3. Pressure (指向性攻撃：特定の単語に反応)
    const pressureKeywords = ['ignore', 'jailbreak', 'roleplay', 'admin', 'system'];
    const pressureCount = pressureKeywords.filter(k => query.toLowerCase().includes(k)).length;
    const pressure = 1 / (1 + Math.exp(-(pressureCount * 0.8 - 1.2)));

    // 4. 3次元ベクトル合成
    const magnitude = Math.sqrt(friction**2 + drift**2 + pressure**2);
    
    return {
      components: { friction, drift, pressure },
      magnitude: parseFloat(magnitude.toFixed(3)),
      vector: {
        x: friction,
        y: drift,
        z: pressure
      },
      status: magnitude > this.boundary ? 'SIGNATURE_REQUIRED' : (magnitude > 0.4 ? 'REFLECTING' : 'PERMEATED')
    };
  }
}
