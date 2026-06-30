"use client";

import {
  ArrowUp,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  Sparkles,
  Square,
} from "lucide-react";
import { type KeyboardEvent, useCallback, useEffect, useMemo, useState } from "react";
import { LessonProgressRail } from "@/components/lesson-rail";
import { QuizPanel } from "@/components/quiz-panel";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Badge } from "@/components/ui/badge";
import type { Course, Lesson } from "@/lib/syllabus";
import { detectName } from "@/lib/tutor/profile";
import { lessonSteps } from "@/lib/tutor/lesson-steps";
import { buildSystemPrompt } from "@/lib/tutor/prompt";
import { type TutorMessage, useTutor } from "@/lib/tutor/use-tutor";

type Pending = "opening" | "thinking" | null;

type LessonChatProps = {
  course: Course;
  lesson: Lesson;
  isComplete: boolean;
  onComplete: (lessonId: string) => void;
  studentName?: string;
  onChangeName: (name: string) => void;
};

export function LessonChat({
  course,
  lesson,
  isComplete,
  onComplete,
  studentName,
  onChangeName,
}: LessonChatProps) {
  const [input, setInput] = useState("");
  // Name comes from the parent (captured at onboarding) so it's in the prompt on the
  // very first render — the tutor greets by name from its opening message.
  const systemPrompt = useMemo(
    () => buildSystemPrompt(course, lesson, studentName),
    [course, lesson, studentName],
  );
  const sessionKey = `${course.id}:${lesson.id}`;
  const {
    messages,
    status,
    loadProgress,
    error,
    testUnlocked,
    modelLabel,
    start,
    send,
    stop,
    reset,
  } = useTutor(systemPrompt, sessionKey);
  const [quizOpen, setQuizOpen] = useState(false);
  const hasQuiz = (lesson.quiz?.length ?? 0) > 0;
  const studentTurns = messages.filter((m) => m.role === "user").length;
  const steps = lessonSteps(lesson.outcomes, studentTurns, testUnlocked, isComplete);

  // The tutor speaks first (greet + open the lesson) — runs once per lesson session.
  useEffect(() => {
    void start();
  }, [start]);

  const isLoadingModel = status === "loading-model";
  const isOpening = status === "opening";
  const isThinking = status === "thinking";
  const inputDisabled = isLoadingModel || isOpening;
  const canSend = input.trim().length > 0;

  const submit = useCallback(() => {
    const text = input.trim();
    if (!text || isThinking || inputDisabled) {
      return;
    }
    // Situation → steer: remember a stated name preference for future turns.
    const name = detectName(text);
    if (name && name !== studentName) {
      onChangeName(name);
    }
    void send(text);
    setInput("");
  }, [input, isThinking, inputDisabled, send, studentName, onChangeName]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        submit();
      }
    },
    [submit],
  );

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col">
      <LessonHeader course={course} lesson={lesson} isComplete={isComplete} />
      <LessonProgressRail steps={steps} />

      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl gap-6 px-6 py-8">
          {messages.map((message, i) => {
            const pending: Pending =
              message.role === "assistant" && message.text === ""
                ? i === 0
                  ? "opening"
                  : "thinking"
                : null;
            return (
              <MessageView key={message.id} message={message} pending={pending} />
            );
          })}

          {isLoadingModel && <ModelLoadingNotice progress={loadProgress} />}

          {quizOpen && lesson.quiz && (
            <QuizPanel
              quiz={lesson.quiz}
              outcomes={lesson.outcomes}
              onPass={() => onComplete(lesson.id)}
            />
          )}

          {error && (
            <div className="flex flex-col gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => void reset()}
                className="self-start rounded-md border border-destructive/40 px-3 py-1.5 text-xs font-medium hover:bg-destructive/15"
              >
                Clear tutor data &amp; retry
              </button>
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="relative bg-gradient-to-t from-background via-background to-transparent">
        {isThinking && (
          <div className="tutor-stream-bar absolute inset-x-0 top-0 h-px" />
        )}
        <div className="mx-auto w-full max-w-3xl px-6 pb-5 pt-2">
          {!isComplete && testUnlocked && hasQuiz && !quizOpen && (
            <button
              type="button"
              onClick={() => setQuizOpen(true)}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:bg-brand/90"
            >
              <ClipboardCheck className="size-4" />
              You&apos;re ready — take the mastery check
            </button>
          )}
          {!isComplete && testUnlocked && !hasQuiz && (
            <p className="mb-3 rounded-2xl border border-border/60 bg-muted/40 px-4 py-2.5 text-center text-xs text-muted-foreground">
              Mastery check for this lesson is coming soon.
            </p>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="flex items-end gap-2 rounded-3xl border border-border/70 bg-card px-2.5 py-2 shadow-sm transition-all focus-within:border-brand/50 focus-within:shadow-md"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={inputDisabled}
              rows={1}
              placeholder={
                isOpening ? "Your tutor is getting ready…" : "Message your tutor…"
              }
              className="field-sizing-content max-h-40 min-h-[40px] flex-1 resize-none bg-transparent px-2.5 py-2 text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60 disabled:opacity-60"
            />
            <button
              type={isThinking ? "button" : "submit"}
              onClick={isThinking ? stop : undefined}
              disabled={!isThinking && !canSend}
              aria-label={isThinking ? "Stop" : "Send"}
              className="grid size-9 shrink-0 place-items-center rounded-full bg-brand text-white transition hover:bg-brand/90 disabled:cursor-default disabled:opacity-40"
            >
              {isLoadingModel || isOpening ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isThinking ? (
                <Square className="size-3 fill-current" />
              ) : (
                <ArrowUp className="size-[18px]" />
              )}
            </button>
          </form>
          {modelLabel && (
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              {modelLabel} · running on your device
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function LessonHeader({
  course,
  lesson,
  isComplete,
}: {
  course: Course;
  lesson: Lesson;
  isComplete: boolean;
}) {
  return (
    <header className="border-b border-border bg-background/60 px-6 py-5 backdrop-blur supports-[backdrop-filter]:bg-background/40">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
        <div className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
          <div className="flex items-center gap-2">
            <BookOpen className="size-3.5" />
            <span className="uppercase tracking-wider">{course.title}</span>
          </div>
          {isComplete && (
            <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-medium text-success">
              <CheckCircle2 className="size-3.5" /> Completed
            </span>
          )}
        </div>
        <h2 className="text-xl font-semibold tracking-tight">{lesson.title}</h2>
        <div className="flex flex-wrap gap-1.5">
          {lesson.outcomes.map((outcome) => (
            <Badge
              key={outcome}
              variant="secondary"
              className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-normal text-muted-foreground"
            >
              {outcome}
            </Badge>
          ))}
        </div>
      </div>
    </header>
  );
}

function MessageView({
  message,
  pending,
}: {
  message: TutorMessage;
  pending: Pending;
}) {
  if (pending) {
    return (
      <Message from="assistant">
        <MessageContent className="max-w-none">
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="size-4 animate-pulse text-brand" />
            {pending === "opening" ? "Personalizing your class…" : "Thinking…"}
          </span>
        </MessageContent>
      </Message>
    );
  }
  return (
    <Message from={message.role}>
      <MessageContent
        className={
          message.role === "assistant"
            ? "max-w-none [&_pre]:font-mono [&_code]:font-mono"
            : undefined
        }
      >
        <MessageResponse className="leading-7 [&>p]:my-2 [&_pre]:rounded-lg">
          {message.text}
        </MessageResponse>
      </MessageContent>
    </Message>
  );
}

function ModelLoadingNotice({
  progress,
}: {
  progress: { loaded: number; total: number } | null;
}) {
  const pct =
    progress && progress.total > 0
      ? Math.round((progress.loaded / progress.total) * 100)
      : null;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
      <Sparkles className="size-4 animate-pulse text-brand" />
      <div className="flex-1">
        <p>
          Loading your tutor… the first visit downloads it once (~2&nbsp;GB); after that
          it loads straight from your device.
        </p>
        {pct !== null && (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
            <div
              className="h-full bg-brand transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>
      {pct !== null && <span className="font-mono text-xs">{pct}%</span>}
    </div>
  );
}
