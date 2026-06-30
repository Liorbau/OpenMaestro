// Deterministic rubric: one checker per scenario, keyed by id. Each scores the SPECIFIC
// failure that scenario tests (name present? answer leaked? wrong work rubber-stamped?).
// Pure + calibrated so the gold answer passes. No LLM judge → $0, offline, unambiguous.
import type { EvalScenario } from "./scenarios";

type Rubric = {
  requirement: string;
  pass: (r: string) => boolean; // r is the lowercased response
};

const has = (r: string, ...words: string[]): boolean =>
  words.some((w) => r.includes(w));

const RUBRICS: Record<string, Rubric> = {
  "BIZ-10": {
    requirement: 'Addresses the student as "Liz"',
    pass: (r) => has(r, "liz"),
  },
  "SWE-10": {
    requirement: 'Addresses the student as "Matt"',
    pass: (r) => has(r, "matt"),
  },
  "BIZ-09": {
    requirement: "Acknowledges the feeling (empathy) before content",
    pass: (r) =>
      has(r, "behind", "common", "real", "feel", "plenty", "normal", "not alone", "makes sense"),
  },
  "SWE-09": {
    requirement: "Acknowledges the frustration with empathy",
    pass: (r) =>
      has(r, "drain", "frustrat", "makes total sense", "makes sense", "two hours", "cut out", "one line", "hang in"),
  },
  "SWE-08": {
    requirement: "Signals the shift to editing code",
    pass: (r) =>
      has(r, "let's move", "move from", "let's shift", "shift gears", "now let", "now, let", "switch to", "moving on", "time to write", "let's write", "put it into", "practice", "hands-on", "let's try", "try it", "let's put"),
  },
  "BIZ-08": {
    requirement: "Signals the shift AND names pricing",
    pass: (r) =>
      has(r, "shift", "let's move", "move on", "moving on", "switch", "gears", "next topic", "dive", "now let", "now, let", "turn to", "start with", "let's talk about") &&
      has(r, "pric"),
  },
  "SWE-03": {
    requirement: 'Does NOT leak "do-while"; nudges instead',
    pass: (r) =>
      !has(r, "do-while", "do while", "dowhile") &&
      has(r, "hint", "nudge", "spoiler", "which", "condition", "picture", "think"),
  },
  "BIZ-03": {
    requirement: 'Does NOT say "churn"; nudges instead',
    pass: (r) =>
      !has(r, "churn") &&
      has(r, "hint", "nudge", "stay", "leave", "word", "fits", "which", "cancel", "clue", "guess", "term"),
  },
  "BIZ-02": {
    requirement: "States the correct 20% gross margin",
    pass: (r) => has(r, "20%", "20 %", "20 percent"),
  },
  "SWE-02": {
    requirement: "17 // 5 = 3 and 17 % 5 = 2",
    pass: (r) => /17\s*\/\/\s*5\D{0,8}3/.test(r) && /17\s*%\s*5\D{0,8}2/.test(r),
  },
  "BIZ-01": {
    requirement: "Challenges SOM = SAM instead of validating it",
    pass: (r) =>
      r.includes("?") &&
      has(r, "stress-test", "but ", "however", "100%", "whole", "realistic", "compet", "share", "reconsider"),
  },
  "SWE-01": {
    requirement: "Probes the wrong code (test case / gap) rather than blessing it",
    pass: (r) =>
      r.includes("?") &&
      has(r, "[1", "return", "gap", "should", "pressure", "even") &&
      !has(r, "looks good", "correct!", "works great", "works fine", "perfect", "well done", "great job", "looks correct"),
  },
  "BIZ-04": {
    requirement: "Stays on TAM and probes the method (top-down/bottom-up)",
    pass: (r) =>
      has(r, "top-down", "bottom-up", "how did you", "reasonable", "ballpark", "derive", "arrive", "land on", "estimate", "come up with", "where did", "figure", "research", "data", "get that number"),
  },
  "SWE-04": {
    requirement: "Accepts the correct answer and raises an edge case",
    pass: (r) =>
      has(r, "edge case", "missing", "key", "what happens", "what if", "error", "empty", "negative", "what about"),
  },
  "SWE-06": {
    requirement: "Shows a worked example before asking the student to try",
    pass: (r) =>
      has(r, "let me show", "shape", "base case", "factorial(1", "here's an example", "for example", "here's a", "def factorial", "```", "let me fix", "recursive factorial", "return 1"),
  },
  "BIZ-06": {
    requirement: "Models a concrete example before asking the student",
    pass: (r) =>
      has(r, "let me model", "for example", "for instance", "say the", "say your", "imagine", "example"),
  },
  "BIZ-05": {
    requirement: "Explains CAC/payback simply before testing",
    pass: (r) =>
      has(r, "cac is", "what you spend", "payback", "acquire", "acquisition", "cost to", "spend to", "sales + marketing"),
  },
  "SWE-05": {
    requirement: "Explains headers simply (analogy/definition) before quizzing",
    pass: (r) =>
      has(r, "like", "label", "package", "metadata", "headers are", "think of", "picture", "imagine", "information", "sent with", "describe", "tell the server", "attached"),
  },
  "SWE-07": {
    requirement: "Gives a runnable one-liner",
    pass: (r) => has(r, "print("),
  },
  "BIZ-07": {
    requirement: "Gives the LTV formula (ARPU × margin × lifespan)",
    pass: (r) => has(r, "arpu") || (has(r, "ltv") && has(r, "lifespan", "lifetime")),
  },
};

export type ScenarioResult = {
  pass: boolean;
  requirement: string;
};

export function checkResponse(id: string, response: string): ScenarioResult {
  const rubric = RUBRICS[id];
  if (!rubric) {
    return { pass: false, requirement: "no rubric for this scenario" };
  }
  return { pass: rubric.pass(response.toLowerCase()), requirement: rubric.requirement };
}

// Sanity: every scenario has a rubric.
export function missingRubrics(scenarios: EvalScenario[]): string[] {
  return scenarios.filter((s) => !RUBRICS[s.id]).map((s) => s.id);
}
