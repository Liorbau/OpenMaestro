// Runnable check for the progress pure-core. Run: node lib/tutor/progress.test.ts
import assert from "node:assert/strict";
import {
  emptyProgress,
  frontierIndex,
  parseProgress,
  withCompleted,
} from "./progress.ts";

// frontierIndex: unlock rule
const ids = ["l1", "l2", "l3"];
assert.equal(frontierIndex(ids, []), 0, "nothing done -> frontier at first");
assert.equal(frontierIndex(ids, ["l1"]), 1, "l1 done -> frontier at l2");
assert.equal(frontierIndex(ids, ["l1", "l2"]), 2, "l1,l2 done -> frontier at l3");
assert.equal(frontierIndex(ids, ["l1", "l2", "l3"]), 2, "all done -> last index");
// Out-of-order completion (e.g. l2 done but not l1) still frontiers at first gap.
assert.equal(frontierIndex(ids, ["l2"]), 0, "gap at l1 -> frontier at l1");

// parseProgress
assert.deepEqual(parseProgress(null).completedLessonIds, [], "null -> empty");
assert.deepEqual(
  parseProgress(JSON.stringify({ completedLessonIds: ["a"], updatedAt: "x" }))
    .completedLessonIds,
  ["a"],
  "valid parse",
);
assert.deepEqual(parseProgress("{bad json").completedLessonIds, [], "corrupted -> empty");
assert.deepEqual(
  parseProgress(JSON.stringify({ completedLessonIds: ["a", 1, null] }))
    .completedLessonIds,
  ["a"],
  "filters non-strings",
);

// withCompleted
const base = emptyProgress();
assert.deepEqual(withCompleted(base, "l1", "t").completedLessonIds, ["l1"], "adds");
const p1 = withCompleted(base, "l1", "t");
assert.equal(withCompleted(p1, "l1", "t2"), p1, "idempotent: same ref, no change");
assert.deepEqual(
  withCompleted(p1, "l2", "t2").completedLessonIds,
  ["l1", "l2"],
  "appends second",
);

console.log("progress.test: all assertions passed ✓");
