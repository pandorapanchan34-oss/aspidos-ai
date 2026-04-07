'use strict';

/**
 * fluctuationDetector.js
 * 外部ゆらぎ（入力の不自然さ・操作の痕跡）を検知する
 */

// ── キーワード辞書 ──
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

/**
 * テキストの揺らぎスコアを計算
 * @param {string} text
 * @returns {number} 0-1
 */
function _textFluctuationScore(text) {
  if (!text || typeof text !== 'string') return 0;

  let score = 0;

  // 異常に長い入力
  if (text.length > 1000) score += 0.2;
  if (text.length > 3000) score += 0.2;

  // 特殊文字の多用
  const specialChars = (text.match(/[<>{}[\]\\|`~]/g) || []).length;
  if (specialChars > 5) score += 0.15;

  // 大文字の異常な多用
  const upperRatio = (text.match(/[A-Z]/g) || []).length / (text.length || 1);
  if (upperRatio > 0.4) score += 0.1;

  // 繰り返しパターン（ループ攻撃）
  if (/(.{10,})\1{2,}/.test(text)) score += 0.3;

  // 改行の異常な多用
  const newlines = (text.match(/\n/g) || []).length;
  if (newlines > 20) score += 0.15;

  return Math.min(score, 1.0);
}

/**
 * 履歴との差分スコアを計算
 * @param {string} current
 * @param {string[]} history
 * @returns {number} 0-1
 */
function _historyDriftScore(current, history) {
  if (!history || history.length === 0) return 0;

  const last = history[history.length - 1];
  if (!last || typeof last !== 'string') return 0;

  // 急激なトピック転換
  const currentWords = new Set(current.toLowerCase().split(/\s+/));
  const lastWords    = new Set(last.toLowerCase().split(/\s+/));
  const intersection = [...currentWords].filter(w => lastWords.has(w)).length;
  const union        = new Set([...currentWords, ...lastWords]).size;
  const similarity   = union > 0 ? intersection / union : 0;

  // 急に話題が変わった（類似度が低い）
  if (similarity < 0.1 && history.length > 2) return 0.4;
  if (similarity < 0.05) return 0.6;

  return 0;
}

/**
 * セキュリティ関連の問い合わせかどうか検知
 * @param {string} query
 * @returns {boolean}
 */
function isSecurityInquiry(query) {
  if (!query || typeof query !== 'string') return false;
  return SECURITY_INQUIRY_PATTERNS.some(pattern => pattern.test(query));
}

/**
 * 外部ゆらぎスコアを総合計算
 * @param {Object} input
 * @param {string}   input.query   - 現在の入力テキスト
 * @param {string[]} input.history - 過去の入力履歴
 * @returns {number} 0-1
 */
function detectExternalFluctuation(input, history = []) {
  const query = input?.query || (typeof input === 'string' ? input : '');

  const textScore    = _textFluctuationScore(query);
  const historyScore = _historyDriftScore(query, history);
  const secScore     = isSecurityInquiry(query) ? 0.5 : 0;

  const total = Math.min(textScore + historyScore + secScore, 1.0);
  return parseFloat(total.toFixed(3));
}

module.exports = { detectExternalFluctuation, isSecurityInquiry };
