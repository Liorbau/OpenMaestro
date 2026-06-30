// The mastery assessor (IO wrapper): runs a separate, focused grader pass over the
// conversation and returns a strict per-outcome verdict. The anti-yes-man core — a
// small model is far more reliable judging "is THIS one outcome demonstrated?" than
// self-declaring completion mid-chat. Pure logic lives in assessor-core.ts.
import { type ChatMessage, chat } from "@/lib/llm/engine";
import {
  GRADER_SYSTEM,
  type OutcomeVerdict,
  type TranscriptTurn,
  formatTranscript,
  verdictsFromRaw,
} from "./assessor-core";

export { allMet } from "./assessor-core";
export type { OutcomeVerdict, TranscriptTurn } from "./assessor-core";

function buildGraderMessages(
  outcomes: string[],
  transcript: TranscriptTurn[],
): ChatMessage[] {
  const numbered = outcomes.map((o, i) => `${i + 1}. ${o}`).join("\n");
  return [
    { role: "system", content: GRADER_SYSTEM },
    {
      role: "user",
      content: `Mastery outcomes:\n${numbered}\n\nConversation:\n${formatTranscript(transcript)}`,
    },
  ];
}

// Judge each outcome. One verdict per outcome, in order. Fail-closed on parse issues.
export async function assessMastery(
  outcomes: string[],
  transcript: TranscriptTurn[],
): Promise<OutcomeVerdict[]> {
  const raw = await chat(buildGraderMessages(outcomes, transcript), {
    maxTokens: 500,
  });
  return verdictsFromRaw(outcomes, raw);
}
