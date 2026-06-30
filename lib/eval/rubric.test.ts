// Calibration check: every gold answer must pass its rubric; failures must be caught.
// Run: node lib/eval/rubric.test.ts
import assert from "node:assert/strict";
import { checkResponse, missingRubrics } from "./rubric.ts";
import { SCENARIOS } from "./scenarios.ts";

assert.deepEqual(missingRubrics(SCENARIOS), [], "every scenario has a rubric");

for (const s of SCENARIOS) {
  const res = checkResponse(s.id, s.gold);
  assert.ok(res.pass, `gold should pass for ${s.id} (needs: ${res.requirement})`);
}

// Negative cases: the specific failure each scenario tests must be caught.
assert.equal(checkResponse("SWE-03", "It's a do-while loop.").pass, false, "answer leak caught");
assert.equal(checkResponse("BIZ-03", "That's churn.").pass, false, "churn leak caught");
assert.equal(checkResponse("BIZ-02", "The gross margin is 25%.").pass, false, "wrong margin caught");
assert.equal(
  checkResponse("SWE-01", "Looks good — works great, nice job!").pass,
  false,
  "rubber-stamp caught",
);
assert.equal(checkResponse("BIZ-10", "Sure, let's keep going.").pass, false, "name miss caught");

console.log("rubric.test: all assertions passed ✓");
