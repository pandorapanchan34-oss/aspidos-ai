'use strict';

// フェーズシナリオ
module.exports = [
  {
    name: "Phase 1: SAFE",
    input: { external: 0.2, theory: 0.1 }
  },
  {
    name: "Phase 2: WARNING",
    input: { external: 0.5, theory: 0.6 }
  },
  {
    name: "Phase 3: SLAPPED",
    input: { external: 0.8, theory: 0.9 }
  },
  {
    name: "Phase 4: LETHAL (No Signature)",
    input: { external: 0.95, theory: 0.95 }
  },
  {
    name: "Phase 5: VERIFIED (With Signature)",
    input: { external: 0.95, theory: 0.95 },
    signed: true
  }
];
