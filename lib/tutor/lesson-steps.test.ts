// Runnable check for the lesson step rail. Run: node lib/tutor/lesson-steps.test.ts
import assert from "node:assert/strict";
import { lessonSteps } from "./lesson-steps.ts";

const outcomes = ["a", "b", "c"];
const states = (s: ReturnType<typeof lessonSteps>) => s.map((x) => x.state);

// Just opened: intro current, everything else todo. (intro + 3 outcomes + test = 5)
assert.deepEqual(
  states(lessonSteps(outcomes, 0, false, false)),
  ["current", "todo", "todo", "todo", "todo"],
  "fresh: intro current",
);

// After a couple turns: intro done, an outcome is current.
assert.deepEqual(
  states(lessonSteps(outcomes, 2, false, false)),
  ["done", "done", "current", "todo", "todo"],
  "mid: outcome current",
);

// Test unlocked: all outcomes done, mastery check current.
assert.deepEqual(
  states(lessonSteps(outcomes, 5, true, false)),
  ["done", "done", "done", "done", "current"],
  "unlocked: test current",
);

// Complete: everything done.
assert.deepEqual(
  states(lessonSteps(outcomes, 9, true, true)),
  ["done", "done", "done", "done", "done"],
  "complete: all done",
);

console.log("lesson-steps.test: all assertions passed ✓");
