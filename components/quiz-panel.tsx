"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { QUIZ_TEMPLATES } from "@/lib/tutor/quiz-templates";
import {
  type AuthoredQuestion,
  gradeQuiz,
  materialize,
  presentOptions,
  type QuizResult,
} from "@/lib/tutor/quiz";

type QuizPanelProps = {
  quiz: AuthoredQuestion[];
  outcomes: string[];
  onPass: () => void;
};

export function QuizPanel({ quiz, outcomes, onPass }: QuizPanelProps) {
  // Bumping `attempt` re-materializes (fresh template values + distractor sample +
  // shuffle) and clears answers on retry.
  const [attempt, setAttempt] = useState(0);
  const [answers, setAnswers] = useState<Array<number | null>>(() =>
    quiz.map(() => null),
  );
  const [result, setResult] = useState<QuizResult | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: attempt drives the reshuffle
  const round = useMemo(() => {
    const materialized = quiz.map((q) => materialize(q, QUIZ_TEMPLATES));
    return { materialized, presented: materialized.map(presentOptions) };
  }, [quiz, attempt]);

  const allAnswered = answers.every((a) => a !== null);

  const submit = (): void => {
    const r = gradeQuiz(round.materialized, answers);
    setResult(r);
    if (r.passed) {
      onPass();
    }
  };

  const retry = (): void => {
    setAnswers(quiz.map(() => null));
    setResult(null);
    setAttempt((a) => a + 1);
  };

  const failed = result !== null && !result.passed;

  return (
    <div className="rounded-2xl border border-brand/30 bg-brand/5 p-5">
      <div className="mb-4 flex items-center gap-2">
        <CheckCircle2 className="size-4 text-brand" />
        <h3 className="text-sm font-semibold tracking-tight">
          Mastery check — answer all correctly to complete the lesson
        </h3>
      </div>

      <ol className="space-y-5">
        {round.materialized.map((q, qi) => (
          <li key={qi} className="space-y-2">
            <p className="text-sm font-medium">
              {qi + 1}. {q.question}
            </p>
            <div className="grid gap-1.5">
              {round.presented[qi].map((opt) => {
                const selected = answers[qi] === opt.originalIndex;
                return (
                  <button
                    key={opt.originalIndex}
                    type="button"
                    disabled={result !== null}
                    onClick={() =>
                      setAnswers((prev) =>
                        prev.map((a, i) => (i === qi ? opt.originalIndex : a)),
                      )
                    }
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                      selected
                        ? "border-brand bg-brand/10 font-medium"
                        : "border-border hover:bg-muted",
                      result !== null && "cursor-default opacity-80",
                    )}
                  >
                    {opt.text}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      {failed && result && (
        <div className="mt-4 space-y-3">
          <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <XCircle className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-medium">
                Not yet — {result.correct}/{result.total} correct.
              </p>
              <p className="mt-1 text-destructive/90">
                Revisit:{" "}
                {result.missedOutcomeIndexes
                  .map((i) => outcomes[i])
                  .filter(Boolean)
                  .join("; ")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={retry}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90"
          >
            Review &amp; try again
          </button>
        </div>
      )}

      {result === null && (
        <button
          type="button"
          onClick={submit}
          disabled={!allAnswered}
          className="mt-5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-opacity hover:bg-brand/90 disabled:opacity-50"
        >
          Submit answers
        </button>
      )}
    </div>
  );
}
