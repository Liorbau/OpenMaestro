// Pure: the checkpoints for the in-lesson progress rail. Intro → one per mastery outcome
// → the mastery check. Each is done / current (pings) / todo, derived from how far the
// student has gotten. See LessonProgressRail.

export type StepState = "done" | "current" | "todo";
export type LessonStep = { key: string; label: string; state: StepState };

export function lessonSteps(
  outcomes: string[],
  studentTurns: number,
  testUnlocked: boolean,
  isComplete: boolean,
): LessonStep[] {
  const steps: LessonStep[] = [];

  if (isComplete) {
    steps.push({ key: "intro", label: "Intro", state: "done" });
    outcomes.forEach((o, i) => steps.push({ key: `o${i}`, label: o, state: "done" }));
    steps.push({ key: "test", label: "Mastery check", state: "done" });
    return steps;
  }

  steps.push({
    key: "intro",
    label: "Intro",
    state: studentTurns > 0 ? "done" : "current",
  });

  if (testUnlocked) {
    outcomes.forEach((o, i) => steps.push({ key: `o${i}`, label: o, state: "done" }));
    steps.push({ key: "test", label: "Mastery check", state: "current" });
    return steps;
  }

  // Learning: outcomes light up progressively with engagement (rough proxy on turns).
  const current =
    outcomes.length === 0
      ? -1
      : Math.min(Math.max(studentTurns - 1, 0), outcomes.length - 1);
  outcomes.forEach((o, i) => {
    let state: StepState = "todo";
    if (i < current) {
      state = "done";
    } else if (i === current && studentTurns > 0) {
      state = "current";
    }
    steps.push({ key: `o${i}`, label: o, state });
  });
  steps.push({ key: "test", label: "Mastery check", state: "todo" });
  return steps;
}
