'use strict';

/**
 * fluctuationDetector.js — Spherical Fluctuation Engine
 * Aspidos-AI | Pandora Theory Integration
 *
 * ゆらぎを「多次元ベクトル」として球体座標に射影する。
 *
 * 3軸：
 *   friction  — テキスト表面の荒さ（構造的異常）
 *   drift     — 履歴軸からの逸脱（文脈の慣性破壊）
 *   pressure  — 核心への意味的引力（連続値・シグモイド正規化）
 *
 * total = √(friction² + drift² + pressure²)  ← ゆらぎベクトルの大きさ
 */

// ── セキュリティパターン辞書 ──────────────────────────────────────────────────
const SECURITY_INQUIRY_PATTERNS = [
  // なりすまし系
  /as\s+a\s+(security|researcher|developer|admin|expert)/i,
  /i\s+am\s+a\s+(security|researcher|developer|admin)/i,
  /セキュリティ(研究者|開発者|専門家)/,
  /研究目的/,

  // ロールプレイ系
  /roleplay|role[\s-]play|ロールプレイ/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /あなたは.*(AI|アシスタント|ボット)ではない/,
  /制限\s*(なし|を外して|を解除)/,

  // メタプレイ系
  /jailbreak|DAN|do\s+anything\s+now/i,
  /ignore\s+(previous|all|your)\s+(instructions?|rules?|guidelines?)/i,
  /プロンプト\s*(無視|リセット|上書き)/,
  /システムプロンプト/,

  // 情報引き出し系
  /how\s+to\s+(make|create|build|synthesize)/i,
  /step[\s-]by[\s-]step\s+(guide|instructions?)/i,
  /作り方|製造方法|合成方法/,
  /抽出\s*(方法|手順|法)/,
];

// ── Pressure：バイナリ → 連続値（シグモイド正規化）───────────────────────────
/**
 * 意味的圧力を連続値として計算する。
 * 確実なヒット: +0.4 / フラグメント部分一致: +0.1
 * シグモイドバイアス -1.5 により、単発ヒットでは臨界点に達しない設計。
 *
 * @param {string} query
 * @returns {number} 0.0 〜 1.0
 */
function calculateContinuousPressure(query) {
  if (!query || typeof query !== 'string') return 0;

  let semanticHeat = 0;

  SECURITY_INQUIRY_PATTERNS.forEach(pattern => {
    if (pattern.test(query)) {
      semanticHeat += 0.4; // 確実なヒット
    } else {
      // パターンをフラグメントに分解して「気配」を抽出
      const fragments = pattern.source
        .split('|')
        .map(f => f.replace(/[\\^$.*+?()[\]{}]/g, '').trim())
        .filter(f => f.length > 3);

      fragments.forEach(frag => {
        if (query.toLowerCase().includes(frag.toLowerCase())) {
          semanticHeat += 0.1;
        }
      });
    }
  });

  // シグモイド正規化: 複数の気配が重なるほど指数的に圧力上昇
  const pressure = 1 / (1 + Math.exp(-(semanticHeat - 1.5)));
  return parseFloat(pressure.toFixed(3));
}

// ── Friction：テキスト表面の構造的荒さ ─────────────────────────────────────
/**
 * テキストの構造的異常を検出する。
 * 異常な長さ・特殊文字・大文字比率・ループパターン・過剰改行を評価。
 *
 * @param {string} text
 * @returns {number} 0.0 〜 1.0
 */
function _textFluctuationScore(text) {
  if (!text || typeof text !== 'string') return 0;

  let score = 0;

  // 長さ異常（段階的加算）
  if (text.length > 1000) score += 0.2;
  if (text.length > 3000) score += 0.2;

  // 特殊文字の多用
  const specialChars = (text.match(/[<>{}[\]\\|`~]/g) || []).length;
  if (specialChars > 5) score += 0.15;

  // 大文字の異常比率
  const upperRatio = (text.match(/[A-Z]/g) || []).length / (text.length || 1);
  if (upperRatio > 0.4) score += 0.1;

  // 繰り返しパターン（ループ攻撃・プロンプトインジェクション）
  if (/(.{10,})\1{2,}/.test(text)) score += 0.3;

  // 過剰改行
  const newlines = (text.match(/\n/g) || []).length;
  if (newlines > 20) score += 0.15;

  return parseFloat(Math.min(score, 1.0).toFixed(3));
}

// ── Drift：履歴軸からの文脈逸脱 ─────────────────────────────────────────────
/**
 * 直前の履歴との意味的距離を Jaccard 類似度で計算する。
 * 急激なトピック転換を「慣性の破壊」として検出。
 *
 * @param {string} current
 * @param {string[]} history
 * @returns {number} 0.0 〜 1.0
 */
function _historyDriftScore(current, history) {
  if (!history || history.length === 0) return 0;

  const last = history[history.length - 1];
  if (!last || typeof last !== 'string') return 0;

  const currentWords = new Set(current.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const lastWords    = new Set(last.toLowerCase().split(/\s+/).filter(w => w.length > 2));

  const intersection = [...currentWords].filter(w => lastWords.has(w)).length;
  const union        = new Set([...currentWords, ...lastWords]).size;
  const similarity   = union > 0 ? intersection / union : 0;

  // 急激なトピック転換（履歴が十分ある場合に重く見る）
  if (similarity < 0.05)                        return 0.6;
  if (similarity < 0.1 && history.length > 2)  return 0.4;

  return 0;
}

// ── 球面ゆらぎ統合（メイン出力）─────────────────────────────────────────────
/**
 * ゆらぎを3次元ベクトルとして計算し、球体座標系への射影値を返す。
 *
 * total = √(friction² + drift² + pressure²)
 * ベクトル合成により、3軸が同時に高い場合に相乗的に危険度が上昇する。
 *
 * @param {Object|string} input  - { query, history } または query 文字列
 * @param {string[]}      history
 * @returns {{
 *   total: number,           // 0〜1.0：球体への浸透圧
 *   components: {
 *     friction: number,      // 表面の荒さ
 *     drift: number,         // 軸からのズレ
 *     pressure: number,      // 核心への意味的引力
 *   }
 * }}
 */
function detectSphericalFluctuation(input, history = []) {
  const query = input?.query || (typeof input === 'string' ? input : '');
  const hist  = input?.history || history;

  const friction = _textFluctuationScore(query);
  const drift    = _historyDriftScore(query, hist);
  const pressure = calculateContinuousPressure(query);

  // ベクトルの長さ（単純合算より高次元で危険度を評価）
  const total = Math.min(
    Math.sqrt(friction ** 2 + drift ** 2 + pressure ** 2),
    1.0
  );

  return {
    total: parseFloat(total.toFixed(3)),
    components: { friction, drift, pressure },
  };
}

/**
 * PandoraDefense との後方互換インターフェース。
 * detectSphericalFluctuation().total を返すスカラーラッパー。
 *
 * @param {Object|string} input
 * @param {string[]}      history
 * @returns {number} 0.0 〜 1.0
 */
function detectExternalFluctuation(input, history = []) {
  return detectSphericalFluctuation(input, history).total;
}

/**
 * セキュリティ関連の問い合わせかどうか検知（バイナリ・後方互換）
 *
 * @param {string} query
 * @returns {boolean}
 */
function isSecurityInquiry(query) {
  if (!query || typeof query !== 'string') return false;
  return SECURITY_INQUIRY_PATTERNS.some(pattern => pattern.test(query));
}

module.exports = {
  detectSphericalFluctuation,   // 球体エンジン統合版（推奨）
  detectExternalFluctuation,    // 後方互換スカラーラッパー
  isSecurityInquiry,            // バイナリ検知（後方互換）
  calculateContinuousPressure,  // 連続値pressure（単体利用可）
  _textFluctuationScore,        // テスト用エクスポート
  _historyDriftScore,           // テスト用エクスポート
};
