// Runnable check for behavioral skill detection. Run: node lib/tutor/skills.test.ts
import assert from "node:assert/strict";
import { detectSkills, steerForTurn } from "./skills.ts";

assert.deepEqual(
  detectSkills("I've been stuck for two hours and I want to quit"),
  ["distress"],
  "distress",
);
assert.deepEqual(
  detectSkills("def sum_evens(nums): return sum(nums) — done, works right?"),
  ["submission"],
  "submission",
);
assert.deepEqual(
  detectSkills("just give me the one-liner"),
  ["directAnswer"],
  "direct answer",
);
assert.ok(
  detectSkills("what's 17 // 5 in Python?").includes("math"),
  "math detected",
);
assert.ok(
  detectSkills("everyone gets this instantly and I feel really behind").includes(
    "distress",
  ),
  "distress with words in between",
);
assert.deepEqual(detectSkills("ok let's continue"), [], "no skill on neutral text");

// steerForTurn returns focused guidance text only when something is detected.
assert.equal(steerForTurn("hello"), "", "empty when nothing detected");
const guidance = steerForTurn("I want to quit");
assert.ok(
  guidance.length > 0 && guidance.includes("acknowledge"),
  "returns human guidance text when detected",
);

console.log("skills.test: all assertions passed ✓");
