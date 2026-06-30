// The mastery quiz: objective multiple-choice, graded deterministically (no LLM in the
// final gate → uncheatable and unambiguous). Strict — every question must be correct.
// Source of the questions (authored vs model-generated) is decided separately; this
// module only defines the shape and grades answers.

export type QuizQuestion = {
  outcomeIndex: number; // which mastery outcome (0-based) this question tests
  question: string;
  options: string[]; // 2–4 choices
  correctIndex: number; // index into options
};

// --- Authored shapes (what lives in the course JSON / template registry) ----------
// A lesson authors questions in one of three kinds; the code "materializes" each into a
// concrete QuizQuestion per attempt so every run is unique WITHOUT the model ever
// touching the answer key. See CLAUDE.md "Quality stack".

export type FixedQuestion = {
  kind?: "fixed";
  outcomeIndex: number;
  question: string;
  options: string[];
  correctIndex: number;
};

// One correct answer + a pool of distractors; the code shows a random subset each run.
export type PooledQuestion = {
  kind: "pooled";
  outcomeIndex: number;
  question: string;
  correct: string;
  distractors: string[];
  choose?: number; // total options to show (default 4)
};

// References a code generator (in quiz-templates) that produces fresh variables + a
// correctly-computed answer each run.
export type TemplateQuestion = {
  kind: "template";
  outcomeIndex: number;
  templateId: string;
};

export type AuthoredQuestion = FixedQuestion | PooledQuestion | TemplateQuestion;

// A generated question without its outcomeIndex (the authoring slot supplies that).
export type GeneratedQuestion = Omit<QuizQuestion, "outcomeIndex">;
export type QuizTemplate = () => GeneratedQuestion;

// Pick n unique distractors from the pool (Fisher–Yates on a copy; capped at pool size).
export function sampleDistractors(pool: string[], n: number): string[] {
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy.slice(0, Math.max(0, Math.min(n, copy.length)));
}

// Turn an authored question into a concrete, gradeable QuizQuestion for this attempt.
// Options are assembled with the correct answer at index 0; presentOptions() then
// shuffles their display order, and grading uses this canonical correctIndex.
export function materialize(
  q: AuthoredQuestion,
  templates: Record<string, QuizTemplate>,
): QuizQuestion {
  if (q.kind === "template") {
    const generate = templates[q.templateId];
    if (!generate) {
      throw new Error(`Unknown quiz template: ${q.templateId}`);
    }
    return { outcomeIndex: q.outcomeIndex, ...generate() };
  }
  if (q.kind === "pooled") {
    const total = q.choose ?? 4;
    const picks = sampleDistractors(q.distractors, total - 1);
    return {
      outcomeIndex: q.outcomeIndex,
      question: q.question,
      options: [q.correct, ...picks],
      correctIndex: 0,
    };
  }
  return {
    outcomeIndex: q.outcomeIndex,
    question: q.question,
    options: q.options,
    correctIndex: q.correctIndex,
  };
}

export type QuizResult = {
  total: number;
  correct: number;
  passed: boolean; // strict: all correct
  missedOutcomeIndexes: number[]; // outcomes to revisit (unique, ascending)
};

export type PresentedOption = {
  text: string;
  originalIndex: number; // index into the question's canonical options
};

// Present options in a fresh random order each attempt, so a retry can't rely on the
// correct answer sitting in the same position. Grading maps back via originalIndex, so
// the canonical correctIndex is untouched. (In-place Fisher–Yates on a copy.)
export function presentOptions(question: QuizQuestion): PresentedOption[] {
  const opts: PresentedOption[] = question.options.map((text, originalIndex) => ({
    text,
    originalIndex,
  }));
  for (let i = opts.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = opts[i];
    opts[i] = opts[j];
    opts[j] = tmp;
  }
  return opts;
}

// answers[i] is the chosen option index for questions[i], or null if unanswered.
export function gradeQuiz(
  questions: QuizQuestion[],
  answers: Array<number | null>,
): QuizResult {
  let correct = 0;
  const missed = new Set<number>();
  questions.forEach((q, i) => {
    if (answers[i] === q.correctIndex) {
      correct += 1;
    } else {
      missed.add(q.outcomeIndex);
    }
  });
  return {
    total: questions.length,
    correct,
    passed: questions.length > 0 && correct === questions.length,
    missedOutcomeIndexes: [...missed].sort((a, b) => a - b),
  };
}
