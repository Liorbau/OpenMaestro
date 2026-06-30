"use client";

import { Briefcase, Code2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Wordmark } from "@/components/logo";
import type { Course } from "@/lib/syllabus";
import { readProgress } from "@/lib/tutor/progress";
import { cn } from "@/lib/utils";

const DEGREE = {
  Biz: { label: "Business", icon: Briefcase },
  SWE: { label: "Software Engineering", icon: Code2 },
} as const;

type ControlCenterProps = {
  open: boolean;
  onClose: () => void;
  courses: Course[];
  activeCourseId: string;
  onSelectCourse: (courseId: string) => void;
  studentName?: string;
  onChangeName: (name: string) => void;
};

// Slide-over hub: degree + overall progress, course switcher, and settings — rendered
// inside the app tree (not a route) so the loaded model stays hot while you navigate.
export function ControlCenter({
  open,
  onClose,
  courses,
  activeCourseId,
  onSelectCourse,
  studentName,
  onChangeName,
}: ControlCenterProps) {
  const [doneByCourse, setDoneByCourse] = useState<Record<string, number>>({});

  // Read each course's completed count from storage when the panel opens.
  useEffect(() => {
    if (!open) {
      return;
    }
    const map: Record<string, number> = {};
    for (const c of courses) {
      const done = new Set(readProgress(c.id).completedLessonIds);
      map[c.id] = c.lessons.filter((l) => done.has(l.id)).length;
    }
    setDoneByCourse(map);
  }, [open, courses]);

  // Close on Escape.
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const degree = DEGREE[courses[0]?.track ?? "SWE"];
  const totalLessons = courses.reduce((n, c) => n + c.lessons.length, 0);
  const totalDone = courses.reduce((n, c) => n + (doneByCourse[c.id] ?? 0), 0);
  const pct = totalLessons ? Math.round((totalDone / totalLessons) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        aria-label="Close control center"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 animate-in fade-in"
      />
      <aside className="relative z-10 flex h-full w-full max-w-md flex-col overflow-y-auto bg-card shadow-2xl duration-300 animate-in slide-in-from-left">
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <Wordmark />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-8 px-6 py-6">
          {/* Degree + overall progress */}
          <section>
            <SectionTitle>Your degree</SectionTitle>
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-border bg-background/50 p-4">
              <span className="flex size-11 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/20">
                <degree.icon className="size-5" />
              </span>
              <div>
                <div className="font-medium">{degree.label}</div>
                <div className="text-sm text-muted-foreground">
                  {totalDone} of {totalLessons} lessons mastered
                </div>
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-brand transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </section>

          {/* Course switcher */}
          <section>
            <SectionTitle>Courses</SectionTitle>
            <ul className="mt-3 space-y-2">
              {courses.map((c) => {
                const done = doneByCourse[c.id] ?? 0;
                const active = c.id === activeCourseId;
                const complete = c.lessons.length > 0 && done === c.lessons.length;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectCourse(c.id);
                        onClose();
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl border p-4 text-left transition hover:bg-muted",
                        active ? "border-brand/40 bg-brand/5" : "border-border"
                      )}
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">{c.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {done}/{c.lessons.length} lessons
                          {active ? " · current" : ""}
                        </div>
                      </div>
                      <span className="ml-3 shrink-0 text-sm font-medium text-brand">
                        {complete ? "Done" : "Open"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Settings */}
          <section>
            <SectionTitle>Settings</SectionTitle>
            <label
              htmlFor="cc-name"
              className="mt-3 block text-sm text-muted-foreground"
            >
              Your name
            </label>
            <NameEditor name={studentName} onChangeName={onChangeName} />
          </section>
        </div>
      </aside>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </h2>
  );
}

function NameEditor({
  name,
  onChangeName,
}: {
  name?: string;
  onChangeName: (name: string) => void;
}) {
  const [draft, setDraft] = useState(name ?? "");
  // Keep the field in sync if the name changes elsewhere (e.g. said mid-lesson).
  useEffect(() => setDraft(name ?? ""), [name]);
  const dirty = draft.trim().length > 0 && draft.trim() !== (name ?? "");

  return (
    <div className="mt-1.5 flex items-center gap-2">
      <input
        id="cc-name"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && dirty) {
            onChangeName(draft);
          }
        }}
        maxLength={24}
        placeholder="Your name"
        className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/15"
      />
      <button
        type="button"
        disabled={!dirty}
        onClick={() => onChangeName(draft)}
        className="h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand/90 disabled:opacity-40"
      >
        Save
      </button>
    </div>
  );
}
