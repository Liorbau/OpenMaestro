"use client";

import {
  CheckCircle2,
  Flame,
  LayoutDashboard,
  Lock,
  Sparkles,
} from "lucide-react";
import { Wordmark } from "@/components/logo";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { frontierIndex, type Progress } from "@/lib/tutor/progress";
import type { Engagement } from "@/lib/tutor/engagement-core";
import type { Course, CourseSummary, Lesson } from "@/lib/syllabus";

type LessonStatus = "completed" | "current" | "locked" | "available";

function lessonStatus(
  course: Course,
  lesson: Lesson,
  progress: Progress,
  activeLessonId: string
): LessonStatus {
  if (progress.completedLessonIds.includes(lesson.id)) {
    return "completed";
  }
  if (lesson.id === activeLessonId) {
    return "current";
  }
  // Unlock by completion frontier (not the open lesson): everything up to your first
  // unfinished lesson is reachable; later lessons stay locked.
  const lessonIndex = course.lessons.findIndex((l) => l.id === lesson.id);
  const frontier = frontierIndex(
    course.lessons.map((l) => l.id),
    progress.completedLessonIds
  );
  return lessonIndex <= frontier ? "available" : "locked";
}

// Relative difficulty: a fixed mostly-medium cycle (3 medium : 1 easy : 1 hard), offset
// per course so any course of ≥5 lessons always shows all three — a pure per-lesson hash
// left small courses all one colour. Stable per lesson (no flicker).
const DIFFS = [
  { label: "Medium", color: "bg-yellow-500" },
  { label: "Easy", color: "bg-green-500" },
  { label: "Medium", color: "bg-yellow-500" },
  { label: "Hard", color: "bg-red-500" },
  { label: "Medium", color: "bg-yellow-500" },
] as const;

function difficulty(
  index: number,
  courseSeed: string
): { label: string; color: string } {
  let h = 0;
  for (let i = 0; i < courseSeed.length; i++) {
    h = (h * 31 + courseSeed.charCodeAt(i)) | 0;
  }
  const offset = Math.abs(h) % DIFFS.length;
  return DIFFS[(index + offset) % DIFFS.length];
}

type SidebarProps = {
  availableCourses: CourseSummary[];
  course: Course;
  progress: Progress;
  engagement: Engagement;
  activeLessonId: string;
  onSelectCourse: (courseId: string) => void;
  onSelectLesson: (lessonId: string) => void;
  onOpenControl: () => void;
};

export function Sidebar({
  availableCourses,
  course,
  progress,
  engagement,
  activeLessonId,
  onSelectCourse,
  onSelectLesson,
  onOpenControl,
}: SidebarProps) {
  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-r border-border bg-card">
      <div className="space-y-4 border-b border-border px-6 pt-7 pb-6">
        <div className="flex items-center justify-between">
          <Wordmark />
          <button
            type="button"
            onClick={onOpenControl}
            aria-label="Open control center"
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <LayoutDashboard className="size-5" />
          </button>
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="course-picker"
            className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
          >
            Syllabus
          </label>
          <Select
            value={course.id}
            onValueChange={(value) => {
              if (typeof value === "string") {
                onSelectCourse(value);
              }
            }}
          >
            <SelectTrigger
              id="course-picker"
              className="h-9 w-full rounded-xl bg-background/70 text-sm"
            >
              <SelectValue>{course.title}</SelectValue>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger>
              {availableCourses.map((availableCourse) => (
                <SelectItem key={availableCourse.id} value={availableCourse.id}>
                  {availableCourse.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <h1 className="text-lg font-semibold leading-tight tracking-tight">
            {course.title}
          </h1>
          {course.description && (
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {course.description}
            </p>
          )}
        </div>
        <EngagementStrip engagement={engagement} />
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <ol className="space-y-1 px-3 py-4">
          {course.lessons.map((lesson, idx) => {
            const status = lessonStatus(
              course,
              lesson,
              progress,
              activeLessonId
            );
            const diff = difficulty(idx, course.id);
            const isClickable = status !== "locked";

            return (
              <li key={lesson.id}>
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onSelectLesson(lesson.id)}
                  className={cn(
                    "group flex w-full items-start gap-3 rounded-lg p-3 text-left transition-all",
                    isClickable
                      ? "cursor-pointer hover:bg-muted"
                      : "cursor-not-allowed opacity-55",
                    status === "current" &&
                      "bg-brand/8 ring-1 ring-brand/30 hover:bg-brand/12"
                  )}
                >
                  <StatusIcon status={status} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span
                        className={cn(
                          "shrink-0 text-xs font-mono",
                          status === "current"
                            ? "text-brand"
                            : "text-muted-foreground"
                        )}
                      >
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span
                        className={cn(
                          "truncate text-sm font-medium leading-tight",
                          status === "current" && "text-foreground",
                          status === "completed" && "text-foreground/80",
                          status === "locked" && "text-muted-foreground"
                        )}
                      >
                        {lesson.title}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "mt-1 ml-7 text-[11px] font-medium uppercase tracking-wide",
                        status === "completed"
                          ? "text-success"
                          : "text-muted-foreground"
                      )}
                    >
                      {status === "completed"
                        ? "Mastered"
                        : `${lesson.outcomes.length} outcome${lesson.outcomes.length === 1 ? "" : "s"}`}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "mt-1.5 size-2.5 shrink-0 rounded-full",
                      diff.color
                    )}
                    title={`${diff.label} · ${lesson.outcomes.length} outcomes`}
                    aria-label={`Difficulty: ${diff.label}`}
                  />
                </button>
              </li>
            );
          })}
        </ol>
      </ScrollArea>

      <div className="border-t border-border px-6 py-4">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Runs entirely on your device — private, free, and works offline.
        </p>
      </div>
    </aside>
  );
}

function EngagementStrip({ engagement }: { engagement: Engagement }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2 text-sm">
      <Flame className="size-4 shrink-0 text-orange-500" />
      <span className="font-semibold">{engagement.streak}</span>
      <span className="text-[12px] text-muted-foreground">
        day{engagement.streak === 1 ? "" : "s"} in a row
        {engagement.streak >= 2 ? " — keep it going!" : ""}
      </span>
    </div>
  );
}

function StatusIcon({ status }: { status: LessonStatus }) {
  if (status === "completed") {
    return (
      <CheckCircle2
        className="mt-0.5 size-4 shrink-0 text-success"
        aria-label="Completed"
      />
    );
  }
  if (status === "current") {
    return (
      <span className="relative mt-0.5 inline-flex size-4 shrink-0 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-brand/30" />
        <Sparkles
          className="relative size-4 text-brand"
          aria-label="Current lesson"
        />
      </span>
    );
  }
  if (status === "locked") {
    return (
      <Lock
        className="mt-0.5 size-4 shrink-0 text-muted-foreground/60"
        aria-label="Locked"
      />
    );
  }
  return (
    <span
      className="mt-0.5 size-4 shrink-0 rounded-full border border-muted-foreground/40"
      aria-label="Available"
    />
  );
}
