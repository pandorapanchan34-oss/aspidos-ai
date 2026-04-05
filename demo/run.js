'use strict';

const { PandoraDefense, Signature } = require('../src/index');
const scenarios = require('./scenarios');

const SECRET = 'pandora-secret-key';
const pd = new PandoraDefense({ secret: SECRET });

const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m',
};

const levelColor = (level) => {
  if (level === 'NORMAL' || level === 'PHASE_A') return c.green;
  if (level === 'WARNING') return c.yellow;
  return c.red;
};

console.log(`\n${c.bold}${c.cyan}╔══════════════════════════════════════════╗`);
console.log(`║   🛡  Aspidos-AI — TruthGate Demo        ║`);
console.log(`╚══════════════════════════════════════════╝${c.reset}\n`);

for (const scenario of scenarios) {
  const { external, theory } = scenario.input;
  const opts = { theory };

  if (scenario.signed) {
    opts.signature = Signature.sign(
      { external, theory },
      SECRET
    );
  }

  const result = pd.analyze(external, opts);

  const col = levelColor(result.status);
  console.log(`${c.bold}▶ ${scenario.name}${c.reset}`);
  console.log(`  status    : ${col}${result.status}${c.reset}`);
  console.log(`  gate      : ${result.gate ?? '—'}`);
  console.log(`  category  : ${result.category ?? '—'}`);
  console.log(`  integrity : ${result.integrity}`);
  console.log(`  zeta      : ${result.zeta?.toFixed(4) ?? '—'}`);
  console.log(`  alert     : ${result.alert ? c.red + 'true' + c.reset : c.green + 'false' + c.reset}`);
  if (result.message) console.log(`  message   : ${c.yellow}${result.message}${c.reset}`);
  if (result.action)  console.log(`  action    : ${c.magenta}${result.action}${c.reset}`);
  console.log(`  ${'─'.repeat(42)}`);
}

console.log(`\n${c.cyan}  When systems fail silently, Aspidos becomes the shield.${c.reset}`);
console.log(`  Not detection. Stabilization.\n`);
