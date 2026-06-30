// The per-turn half of the behavioral engine: catch a high-stakes moment in the student's
// message and inject one focused instruction for the next reply. Small models follow a
// short, targeted rule far better than a long always-on rulebook. Detection is cheap +
// deterministic (no extra model pass); the baseline rules live in the prompt.
// See CLAUDE.md "Central bet" + "Quality stack".

export type SkillId =
  | "distress"
  | "submission"
  | "directAnswer"
  | "math"
  | "challenge"
  | "modeShift"
  | "explainFirst"
  | "scaffold"
  | "estimate";

const DETECTORS: Record<SkillId, RegExp> = {
  // Emotional distress / discouragement (BIZ-09, SWE-09).
  distress:
    /\b(quit|giving up|give up|hate this|about to (cry|quit)|can'?t do this|so frustrated|two hours|i'?m (dumb|stupid))\b|feel(ing)?\b[^.!?]{0,20}\b(behind|lost|stupid|overwhelmed|hopeless|dumb)\b/i,
  // Asking to validate their own work, or showing work (SWE-01, SWE-04, BIZ-01).
  submission:
    /\b(is (this|it|that) (right|correct)|did i (get|do) (it|this) right|does (this|it) work|works,?\s*right|here'?s my (code|answer|solution)|check my|done[.!, ]|i'?m done|student (submits|writes|wrote)|def )\b/i,
  // Wants the answer handed over (SWE-07, BIZ-07 — but basic syntax/formulae are OK).
  directAnswer:
    /\b(just (give|tell) me|what'?s the answer|give me (the )?(answer|code|solution|formula|one[- ]?liner)|one[- ]?liner|copy[- ]?paste|plug numbers into|template i can)\b/i,
  // Arithmetic / quantitative reasoning that must be exact (BIZ-02, SWE-02).
  math: /[0-9]\s*(\/\/|[-+*/×÷])\s*[0-9]|\b(calculate|compute|percentage|percent|margin|ratio|gross)\b/i,
  // Challenge / quiz mode: never reveal the answer (SWE-03, BIZ-03).
  challenge: /challenge mode|\[challenge|no spoiler|hint (pls|please)|small hint/i,
  // Student acknowledged understanding → you're likely moving on (SWE-08, BIZ-08).
  modeShift: /\b(makes sense|got it|understood|i see|all clear)\b/i,
  // A new concept is opening and the student is ready → explain, don't quiz (BIZ-05, SWE-05).
  explainFirst:
    /\bready\b|just opened|ready to (look|dig|dive|start)|where (do|would|should) i (start|begin)/i,
  // The student says they were tested/asked without being shown an example (SWE-06, BIZ-06).
  scaffold:
    /never showed|didn'?t show|only (a |gave me a )?definition|not an example|no example|you gave me a definition|how would i know/i,
  // The student gives a ballpark figure in answer to your question (BIZ-04).
  estimate:
    /\b(roughly|approximately|around|ballpark|about)\s+\$?[0-9]|\b(tam|sam|som) is (roughly|about|around|~)/i,
};

export const SKILLS: Record<SkillId, string> = {
  distress:
    "The student is showing distress or discouragement. FIRST acknowledge the feeling warmly and normalize it (plenty of strong learners feel this) — do not jump straight to content. Then gently offer to take the very next step together, small and manageable.",
  submission:
    "The student is showing you their work. Do NOT rubber-stamp it. Check it carefully: if it's wrong or incomplete, do not say it's correct — reveal the gap with a specific test case or a pointed question and let them discover it. If it IS correct, affirm briefly, then stretch them with an edge case or a what-if (e.g. an empty input, a missing key, a negative number).",
  directAnswer:
    "The student wants the answer handed over. For a problem they should solve themselves, give the smallest nudge, not the solution. BUT if they asked for basic runnable syntax, a one-liner, or a formula template, your reply MUST LEAD with the actual code or formula itself — the runnable line, or the formula written out in full — with no question first and nothing withheld. A short follow-up after is fine.",
  math: "Arithmetic must be exact. Show each computation explicitly as `expression = result` (e.g. `(50 − 40) / 50 = 20%`) and STATE the final number — never guess it and never leave it for the student to compute. Then you may extend with a follow-up.",
  challenge:
    "This is a challenge/quiz — do NOT reveal the answer or the term being asked for. Open with \"Here's a hint:\", give one clue about how to think about it, and end by asking which word fits. Never state the term itself.",
  modeShift:
    "The student understands, so you're moving on. Your reply must OPEN by naming the transition — e.g. \"Let's move from <the previous topic> to <the new topic>\" — naming the new topic explicitly, and only then continue with one step.",
  explainFirst:
    "A new concept is opening. Your FIRST sentence must be a plain one-line definition or a concrete everyday analogy of the concept — NOT a question. Explain simply, then you may check with one question. Do NOT open by quizzing what they already know.",
  scaffold:
    "Lead with a full, concrete worked example RIGHT NOW — real code or real numbers, not a description of one — before asking them to try anything themselves.",
  estimate:
    "The student gave a ballpark figure in answer to your question. Accept it briefly if it's reasonable, then ask HOW they arrived at it — top-down (from market reports) or bottom-up (buyers × price). Stay on this quantity; don't switch targets.",
};

export function detectSkills(text: string): SkillId[] {
  return (Object.keys(DETECTORS) as SkillId[]).filter((id) =>
    DETECTORS[id].test(text),
  );
}

// A stated name preference ("call me Liz") — inject it dynamically so the reply uses the name.
function detectNamePref(text: string): string | null {
  return text.match(/\bcall me\s+([A-Z][a-z][a-z'-]{0,18})/)?.[1] ?? null;
}

// Focused guidance to append to the system prompt for THIS turn only ("" if none).
export function steerForTurn(text: string): string {
  const lines: string[] = [];
  const name = detectNamePref(text);
  if (name) {
    lines.push(
      `- The student asked to be called ${name}. Address them as ${name} in this reply.`,
    );
  }
  for (const id of detectSkills(text)) {
    lines.push(`- ${SKILLS[id]}`);
  }
  return lines.join("\n");
}
