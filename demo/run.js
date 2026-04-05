'use strict';

const { PandoraDefense, Signature } = require('../src');
const scenarios = require('./scenarios');

const SECRET = "aspidos-secret";

const pd = new PandoraDefense({ secret: SECRET });

// 色付け（簡易）
const color = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
};

// レベル色分け
function levelColor(status) {
  if (status === "SLAPPED" || status === "CLIFF") return color.red(status);
  if (status === "WARNING") return color.yellow(status);
  if (status === "PHASE_A" || status === "PHASE_B") return color.green(status);
  return color.cyan(status);
}

console.log("\n🛡 Aspidos-AI CLI Demo\n");

scenarios.forEach((scenario, index) => {
  console.log("====================================");
  console.log(`▶ ${scenario.name}`);

  let signature = null;

  if (scenario.signed) {
    signature = Signature.sign(scenario.input, SECRET);
  }

  const result = pd.analyze(scenario.input.external, {
    theory: scenario.input.theory,
    signature
  });

  console.log(`Status   : ${levelColor(result.status)}`);
  console.log(`Category : ${result.category}`);
  console.log(`Zeta     : ${result.zeta.toFixed(3)}`);
  console.log(`Omega    : ${result.omega.toFixed(3)}`);
  console.log(`Gate     : ${result.gate}`);

  if (result.message) {
    console.log(`Message  : ${result.message}`);
  }

  if (result.alert) {
    console.log(color.red("⚠ ALERT TRIGGERED"));
  }

  console.log("");
});

console.log("====================================\n");
console.log("✅ Demo Complete\n");
