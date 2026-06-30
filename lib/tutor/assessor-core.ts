// Pure, dependency-free core for the mastery assessor (no engine/wllama import, so it's
// unit-testable in plain node). The IO wrapper lives in assessor.ts.

export type OutcomeVerdict = {
  outcome: string;
  met: boolean;
  evidence: string;
};

export type TranscriptTurn = {
  role: "user" | "assistant";
  text: string;
};

export const GRADER_SYSTEM = `You are a STRICT mastery assessor for a tutoring app. You will be given a lesson's mastery outcomes and the tutor/student conversation.

For EACH outcome, decide whether the STUDENT has personally DEMONSTRATED it — by answering a question correctly, writing correct code, or explaining the idea in their OWN words. Being *told* or *shown* the concept by the tutor does NOT count. If the evidence is weak, missing, or ambiguous, mark it false. Be skeptical; when in doubt, false.

Respond with ONLY a JSON array — one object per outcome, in the same order — and nothing else:
[{"met": true or false, "evidence": "short quote or reason"}]`;

export function formatTranscript(transcript: TranscriptTurn[]): string {
  return transcript
    .map((t) => `${t.role === "user" ? "STUDENT" : "TUTOR"}: ${t.text}`)
    .join("\n");
}

// Extract the first JSON array from model text (small models wrap it in prose).
export function extractJsonArray(text: string): unknown[] | null {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(text.slice(start, end + 1));
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

// Map raw grader text -> one verdict per outcome, in order. Fail-closed: anything not
// an explicit `true` counts as NOT met (unearned completion is the worse failure).
export function verdictsFromRaw(
  outcomes: string[],
  raw: string,
): OutcomeVerdict[] {
  const parsed = extractJsonArray(raw);
  return outcomes.map((outcome, i) => {
    const item = parsed?.[i] as { met?: unknown; evidence?: unknown } | undefined;
    return {
      outcome,
      met: item?.met === true,
      evidence: typeof item?.evidence === "string" ? item.evidence : "",
    };
  });
}

export function allMet(verdicts: OutcomeVerdict[]): boolean {
  return verdicts.length > 0 && verdicts.every((v) => v.met);
}
