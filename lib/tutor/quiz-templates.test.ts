// Verifies each template's computed answer key is correct across many random runs.
// Run: node lib/tutor/quiz-templates.test.ts
import assert from "node:assert/strict";
import { QUIZ_TEMPLATES } from "./quiz-templates.ts";

function nums(re: RegExp, s: string): number[] {
  const m = s.match(re);
  if (!m) {
    throw new Error(`pattern ${re} did not match: ${s}`);
  }
  return m.slice(1).map(Number);
}

// Basic shape invariants for every template.
for (const [id, generate] of Object.entries(QUIZ_TEMPLATES)) {
  for (let i = 0; i < 40; i += 1) {
    const q = generate();
    assert.ok(q.options.length >= 2, `${id}: at least 2 options`);
    assert.ok(
      q.correctIndex >= 0 && q.correctIndex < q.options.length,
      `${id}: correctIndex in range`,
    );
    assert.equal(typeof q.options[q.correctIndex], "string", `${id}: correct exists`);
  }
}

// Correctness: re-derive the answer from the generated text and compare.
for (let i = 0; i < 60; i += 1) {
  const r = QUIZ_TEMPLATES["py101-range-count"]();
  const [n] = nums(/range\((\d+)\)/, r.question);
  assert.equal(r.options[r.correctIndex], String(n), "range-count: answer = n");

  const a = QUIZ_TEMPLATES["py101-int-add"]();
  const [x, y] = nums(/int\("(\d+)"\) \+ (\d+)/, a.question);
  assert.equal(a.options[a.correctIndex], String(x + y), "int-add: answer = a+b");

  const b = QUIZ_TEMPLATES["py101-bool-and"]();
  const [p, q, s, t] = nums(/\((\d+) > (\d+)\) and \((\d+) == (\d+)\)/, b.question);
  const expected = p > q && s === t ? "True" : "False";
  assert.equal(b.options[b.correctIndex], expected, "bool-and: answer correct");

  const g = QUIZ_TEMPLATES["biz-gross-margin"]();
  const [cost, price] = nums(/costs \$(\d+).*sells for \$(\d+)/, g.question);
  assert.equal(
    g.options[g.correctIndex],
    `${Math.round(((price - cost) / price) * 100)}%`,
    "gross-margin: answer = (price-cost)/price",
  );
}

console.log("quiz-templates.test: all assertions passed ✓");
