// Runnable check for the verifier. Run: node lib/tutor/verify.test.ts
import assert from "node:assert/strict";
import {
  correctArithmetic,
  evalArith,
  redactLeak,
  trimDangling,
  verifyReply,
} from "./verify.ts";

// --- evalArith: the safe evaluator ---------------------------------------------------
assert.equal(evalArith("50 - 40"), 10, "subtraction");
assert.equal(evalArith("(50 - 40) / 50"), 0.2, "parens + division");
assert.equal(evalArith("17 // 5"), 3, "floor division");
assert.equal(evalArith("17 % 5"), 2, "modulo");
assert.equal(evalArith("2 + 3 * 4"), 14, "precedence");
assert.equal(evalArith("10 ÷ 2 × 3"), 15, "unicode ops");
assert.equal(evalArith("50"), null, "bare number → nothing to check");
assert.equal(evalArith("x + 2"), null, "variable → not numeric");
assert.equal(evalArith("5 / 0"), null, "division by zero → refuse");
assert.equal(evalArith("(1 + 2"), null, "unbalanced parens → refuse");

// --- correctArithmetic: fixes wrong results, leaves right ones alone ------------------
// BIZ-02: gross margin computed off cost (wrong) → corrected to 20%.
assert.equal(
  correctArithmetic("Gross margin is (50 - 40) / 50 = 25%."),
  "Gross margin is (50 - 40) / 50 = 20%.",
  "wrong percent corrected",
);
// Already correct → untouched.
assert.equal(
  correctArithmetic("(50 - 40) / 50 = 20%"),
  "(50 - 40) / 50 = 20%",
  "correct percent untouched",
);
// SWE-02: floor div / mod, both correct → untouched.
assert.equal(
  correctArithmetic("17 // 5 = 3 and 17 % 5 = 2"),
  "17 // 5 = 3 and 17 % 5 = 2",
  "correct int ops untouched",
);
// SWE-02 wrong → corrected.
assert.equal(
  correctArithmetic("17 // 5 = 4"),
  "17 // 5 = 3",
  "wrong floor div corrected",
);
// Hedged claim → left alone (a tutor rounding on purpose).
assert.equal(
  correctArithmetic("that's about 3 / 7 = 0.43"),
  "that's about 3 / 7 = 0.43",
  "hedged/approx left alone",
);
// Non-arithmetic equals → untouched (no false positives).
assert.equal(
  correctArithmetic("Chapter 3 = intro; step 2 covers loops."),
  "Chapter 3 = intro; step 2 covers loops.",
  "non-numeric equals untouched",
);

// Prose equalities ("is" / "gives"), not just "=".
assert.equal(
  correctArithmetic("17 % 5 is 0.4"),
  "17 % 5 is 2",
  "prose 'is' modulo corrected",
);
assert.equal(
  correctArithmetic("17 // 5 gives 3"),
  "17 // 5 gives 3",
  "prose 'gives' correct value untouched",
);
assert.equal(
  correctArithmetic("(50 - 40) / 50 is 25%"),
  "(50 - 40) / 50 is 20%",
  "prose 'is' percent corrected",
);
// Plain-word 'is' with no operator is left alone (not an arithmetic claim).
assert.equal(
  correctArithmetic("Chapter 3 is where loops start."),
  "Chapter 3 is where loops start.",
  "no-operator 'is' untouched",
);

// verifyReply is the public entry point.
assert.equal(verifyReply("2 + 2 = 5"), "2 + 2 = 4", "verifyReply corrects");

// --- trimDangling: drop a cut-off trailing fragment, keep clean endings ---------------
assert.equal(
  trimDangling("Nice. What would you get from int(1"),
  "Nice.",
  "mid-word cut trimmed to last sentence",
);
assert.equal(
  trimDangling("What type is z? Can you explain"),
  "What type is z?",
  "cut after question kept up to the question",
);
assert.equal(
  trimDangling("What type is z?"),
  "What type is z?",
  "clean question untouched",
);
assert.equal(
  trimDangling("Try this:\n```py\nprint(1)\n```"),
  "Try this:\n```py\nprint(1)\n```",
  "code fence ending untouched",
);
assert.equal(trimDangling("sure"), "sure", "short no-punct reply left alone");

// --- redactLeak: challenge-mode backstop -------------------------------------------
assert.ok(
  !redactLeak("It's the do-while loop.", ["do-while"]).toLowerCase().includes("do-while"),
  "leaked term is scrubbed",
);
assert.equal(
  redactLeak("Which loop checks the condition after? Picture it.", ["do-while"]),
  "Which loop checks the condition after? Picture it.",
  "clean nudge left untouched",
);

console.log("verify.test.ts: all assertions passed");
