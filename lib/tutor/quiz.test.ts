// Runnable check for quiz grading. Run: node lib/tutor/quiz.test.ts
import assert from "node:assert/strict";
import {
  type AuthoredQuestion,
  gradeQuiz,
  materialize,
  presentOptions,
  type QuizQuestion,
  sampleDistractors,
} from "./quiz.ts";

const q = (outcomeIndex: number, correctIndex: number): QuizQuestion => ({
  outcomeIndex,
  question: "q",
  options: ["a", "b", "c"],
  correctIndex,
});

const questions = [q(0, 1), q(1, 2), q(2, 0)];

// All correct -> passed, nothing missed
let r = gradeQuiz(questions, [1, 2, 0]);
assert.equal(r.passed, true, "all correct -> passed");
assert.equal(r.correct, 3);
assert.deepEqual(r.missedOutcomeIndexes, []);

// One wrong -> strict fail, reports the missed outcome
r = gradeQuiz(questions, [1, 0, 0]);
assert.equal(r.passed, false, "one wrong -> not passed (strict)");
assert.equal(r.correct, 2);
assert.deepEqual(r.missedOutcomeIndexes, [1]);

// Unanswered counts as wrong
r = gradeQuiz(questions, [1, 2, null]);
assert.equal(r.passed, false, "null answer -> wrong");
assert.deepEqual(r.missedOutcomeIndexes, [2]);

// Empty quiz never passes
assert.equal(gradeQuiz([], []).passed, false, "empty -> not passed");

// presentOptions: a permutation that preserves every option + its original index
const question = q(0, 2);
const presented = presentOptions(question);
assert.equal(presented.length, 3, "same number of options");
assert.deepEqual(
  presented.map((p) => p.originalIndex).sort((a, b) => a - b),
  [0, 1, 2],
  "every original index present exactly once",
);
for (const p of presented) {
  assert.equal(p.text, question.options[p.originalIndex], "text matches its origin");
}

// sampleDistractors: n unique from pool, capped at pool size
const pool = ["a", "b", "c", "d"];
const s = sampleDistractors(pool, 2);
assert.equal(s.length, 2, "samples n");
assert.ok(
  s.every((x) => pool.includes(x)) && new Set(s).size === s.length,
  "unique, all from pool",
);
assert.equal(sampleDistractors(pool, 10).length, 4, "capped at pool size");

// materialize: fixed passes through
const fixed: AuthoredQuestion = {
  outcomeIndex: 0,
  question: "q",
  options: ["x", "y"],
  correctIndex: 1,
};
assert.equal(materialize(fixed, {}).correctIndex, 1, "fixed passthrough");

// materialize: pooled keeps correct answer + chosen count
const pooled: AuthoredQuestion = {
  kind: "pooled",
  outcomeIndex: 1,
  question: "q",
  correct: "RIGHT",
  distractors: ["w1", "w2", "w3", "w4"],
  choose: 3,
};
const mp = materialize(pooled, {});
assert.equal(mp.options.length, 3, "shows `choose` options");
assert.equal(mp.options[mp.correctIndex], "RIGHT", "correct answer is present + marked");

// materialize: template uses the registry + authoring-slot outcomeIndex; unknown throws
const templates = {
  t1: () => ({ question: "gen", options: ["a", "b"], correctIndex: 1 }),
};
const mt = materialize({ kind: "template", outcomeIndex: 2, templateId: "t1" }, templates);
assert.equal(mt.outcomeIndex, 2, "outcomeIndex from the authoring slot");
assert.equal(mt.options[mt.correctIndex], "b", "template answer key preserved");
assert.throws(
  () => materialize({ kind: "template", outcomeIndex: 0, templateId: "nope" }, templates),
  /Unknown quiz template/,
  "unknown template throws",
);

console.log("quiz.test: all assertions passed ✓");
