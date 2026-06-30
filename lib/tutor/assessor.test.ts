// Runnable check for the assessor pure core. Run: node lib/tutor/assessor.test.ts
import assert from "node:assert/strict";
import {
  allMet,
  extractJsonArray,
  type OutcomeVerdict,
  verdictsFromRaw,
} from "./assessor-core.ts";

// extractJsonArray: prose-wrapped, plain, malformed
assert.deepEqual(
  extractJsonArray('Sure! [{"met":true}] done'),
  [{ met: true }],
  "prose-wrapped array",
);
const two = extractJsonArray('[{"met":false},{"met":true}]');
assert.ok(two !== null && two.length === 2, "plain array");
assert.equal(extractJsonArray("no json here"), null, "no array -> null");
assert.equal(extractJsonArray("[not valid json"), null, "malformed -> null");

// allMet: fail-closed gate
const v = (met: boolean): OutcomeVerdict => ({ outcome: "o", met, evidence: "" });
assert.equal(allMet([]), false, "empty -> not mastered");
assert.equal(allMet([v(true), v(true)]), true, "all met -> mastered");
assert.equal(allMet([v(true), v(false)]), false, "one unmet -> not mastered");

// verdictsFromRaw: shape + fail-closed
const outs = ["a", "b"];
const good = verdictsFromRaw(outs, '[{"met":true,"evidence":"x"},{"met":true}]');
assert.equal(good.length, 2, "one verdict per outcome");
assert.equal(good[0]?.met, true, "true -> met");
assert.equal(good[0]?.evidence, "x", "evidence carried");
assert.equal(good[1]?.evidence, "", "missing evidence -> empty");
assert.ok(
  verdictsFromRaw(outs, '[{"met":"yes"},{}]').every((v) => !v.met),
  "non-boolean/missing met -> false (fail-closed)",
);
const garbage = verdictsFromRaw(outs, "totally not json");
assert.equal(garbage.length, 2, "unparseable still yields one verdict per outcome");
assert.ok(garbage.every((v) => !v.met), "unparseable -> all false (fail-closed)");

console.log("assessor.test: all assertions passed ✓");
