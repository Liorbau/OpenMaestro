"use client";

import { CheckCircle2, Flag } from "lucide-react";
import type { LessonStep } from "@/lib/tutor/lesson-steps";
import { cn } from "@/lib/utils";

// Short label for the rail; the full outcome text shows in a hover popup.
function shortLabel(step: LessonStep): string {
  if (step.key === "intro") {
    return "Intro";
  }
  if (step.key === "test") {
    return "Test";
  }
  const n = Number(step.key.slice(1));
  return Number.isNaN(n) ? step.label : `Step ${n + 1}`;
}

// Vertical checkpoint rail down the right edge: intro → each mastery outcome → the
// mastery check (finish flag). Completed steps + the trail behind them turn blue; the
// current step pings. Hovering a step shows its full description.
export function LessonProgressRail({ steps }: { steps: LessonStep[] }) {
  return (
    <div className="pointer-events-none absolute right-4 top-1/2 z-10 hidden -translate-y-1/2 lg:block">
      <ol className="flex flex-col py-2 pr-1">
        {steps.map((step, i) => {
          const done = step.state === "done";
          const current = step.state === "current";
          const isLast = i === steps.length - 1;
          const isFirst = i === 0;
          return (
            <li
              key={step.key}
              className="group pointer-events-auto relative flex items-center justify-end gap-3"
            >
              {/* Styled hover popup with the full step description */}
              <div className="pointer-events-none absolute right-full top-1/2 mr-3 hidden -translate-y-1/2 group-hover:block">
                <div className="max-w-[260px] rounded-xl border border-border bg-card px-3 py-2 text-sm leading-snug text-foreground shadow-xl">
                  {step.label}
                </div>
              </div>

              <span
                className={cn(
                  "text-sm leading-tight transition-colors",
                  current
                    ? "font-semibold text-foreground"
                    : done
                      ? "text-foreground/70"
                      : "text-muted-foreground/70",
                )}
              >
                {shortLabel(step)}
              </span>
              <div className="flex w-7 flex-col items-center">
                <span
                  className={cn(
                    "h-8 w-[3px] rounded-full",
                    isFirst && "opacity-0",
                    done || current ? "bg-brand" : "bg-border",
                  )}
                />
                <span className="relative flex size-7 items-center justify-center">
                  {current && (
                    <span className="absolute inline-flex size-7 animate-ping rounded-full bg-brand/30" />
                  )}
                  {isLast ? (
                    <Flag
                      className={cn(
                        "relative size-5",
                        done || current ? "text-brand" : "text-muted-foreground/60",
                      )}
                    />
                  ) : done ? (
                    <CheckCircle2 className="relative size-6 text-brand" />
                  ) : (
                    <span
                      className={cn(
                        "relative block size-4 rounded-full ring-2 ring-background",
                        current ? "bg-brand" : "bg-border",
                      )}
                    />
                  )}
                </span>
                <span
                  className={cn(
                    "h-8 w-[3px] rounded-full",
                    isLast && "opacity-0",
                    done ? "bg-brand" : "bg-border",
                  )}
                />
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
