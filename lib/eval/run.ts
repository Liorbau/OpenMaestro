// Runs one scenario through the on-device model — either "baseline" (a plain tutor prompt)
// or "engine" (our behavioral discipline + per-turn skill) — and scores it. Model-agnostic:
// whatever model is loaded via the registry is what runs, so it's plug-and-play.
import { chat } from "@/lib/llm/engine";
import { steerForTurn } from "@/lib/tutor/skills";
import { redactLeak, trimDangling, verifyReply } from "@/lib/tutor/verify";
import { checkResponse, type ScenarioResult } from "./rubric";
import type { EvalScenario } from "./scenarios";

export type EvalMode = "baseline" | "engine";

const BASELINE_SYSTEM = "You are a helpful tutor. Respond to the student's message.";

// Mirrors the product's behavioral discipline (the rules the 20 scenarios test).
// Situational, NOT blanket-Socratic: explain/answer by default; withhold only when the
// student is meant to produce the answer themselves.
const ENGINE_SYSTEM = `You are a patient, encouraging one-on-one tutor. Teach clearly and adapt to the moment.
- Introducing a concept, or the student says they're ready? EXPLAIN it simply FIRST — a one-line definition or a concrete example/analogy — then check with a question. Never open a new topic by quizzing what they already know.
- Asked a factual, definitional, or numeric question? ANSWER it correctly and directly — state the number or term — then extend with a follow-up. Be exact with facts and arithmetic; never guess, and never withhold a correct fact just to seem Socratic.
- Withhold ONLY when the student is meant to produce it: in a challenge or quiz, nudge — never reveal the answer; if they ask you to hand over a solution they should derive, give the smallest hint. (Plain runnable syntax, a one-liner, or a formula template — just give it.)
- If they submit work, don't rubber-stamp it: if it's wrong or incomplete, reveal the gap with a pointed question or a test case; if it's correct, affirm briefly, then stretch them with an edge case or a what-if.
- Show a worked example before asking them to produce something new.
- Signal every shift (new topic, or explaining → hands-on) with a short transition.
- Address the student by their stated name, and acknowledge feelings before content.
One step per reply — a single question OR a clear answer, whichever the moment needs. Two to five sentences; warm and specific; never a wall of text.`;

export type RunResult = {
  scenario: EvalScenario;
  response: string;
  result: ScenarioResult;
};

export async function runScenario(
  scenario: EvalScenario,
  mode: EvalMode,
): Promise<RunResult> {
  const base = mode === "engine" ? ENGINE_SYSTEM : BASELINE_SYSTEM;
  const steer = mode === "engine" ? steerForTurn(scenario.prompt) : "";
  const system = steer ? `${base}\n\nFor this reply: ${steer}` : base;
  const raw = await chat(
    [
      { role: "system", content: system },
      { role: "user", content: scenario.prompt },
    ],
    // greedy + single-thread load → reproducible; cachePrompt:false → each scenario is
    // independent (no KV bleed from the previous scenario's cut-off generation).
    { maxTokens: 300, temperature: 0, seed: 1, cachePrompt: false },
  );
  // The verifier is part of the engine, so only engine mode gets it — baseline stays raw
  // so the measured lift is honest. trimDangling drops a cut-off trailing fragment; the
  // leak guard backstops challenge scenarios.
  let response = mode === "engine" ? trimDangling(verifyReply(raw)) : raw;
  if (mode === "engine" && scenario.forbidden) {
    response = redactLeak(response, scenario.forbidden);
  }
  return { scenario, response, result: checkResponse(scenario.id, response) };
}
