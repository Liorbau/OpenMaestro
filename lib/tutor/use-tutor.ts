"use client";

// Client chat hook that drives the on-device tutor. Replaces AI SDK's server-backed
// useChat: same minimal surface but inference runs in the browser via lib/llm/engine.
// Owns the mastery-test readiness gate AND per-lesson transcript persistence + the
// tutor-initiated opening. See CLAUDE.md "Chat wiring" + "Quality stack".
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type ChatMessage,
  chat,
  isCached,
  isModelLoaded,
  loadModel,
  resetCache,
} from "@/lib/llm/engine";
import { instantModelFor, selectModel } from "@/lib/llm/registry";
import { steerForTurn } from "@/lib/tutor/skills";
import {
  clearTranscript,
  readTranscript,
  saveTranscript,
} from "@/lib/tutor/transcripts";
import { trimDangling, verifyReply } from "@/lib/tutor/verify";

export type TutorMessage = { id: string; role: "user" | "assistant"; text: string };
export type TutorStatus =
  | "idle"
  | "loading-model"
  | "opening"
  | "thinking"
  | "ready";
export type LoadProgress = { loaded: number; total: number } | null;

export type UseTutor = {
  messages: TutorMessage[];
  status: TutorStatus;
  loadProgress: LoadProgress;
  error: string | null;
  testUnlocked: boolean;
  modelLabel: string;
  start: () => Promise<void>;
  send: (text: string) => Promise<void>;
  stop: () => void;
  reset: () => Promise<void>;
};

const READY_MARKER_RE = /<<\s*ready\s*>>/gi;
// Backstop so a learner can never get stuck: the test unlocks after this many turns no
// matter what. The tutor's <<READY>> (after covering every outcome) is the normal unlock;
// this is only the can't-get-trapped floor, so keep it high enough for a real lesson.
const ENGAGEMENT_FLOOR = 8;
// Only the most recent turns are sent to the model, to bound CPU prefill time on long chats.
const HISTORY_LIMIT = 12;
// Cap a single reply. With the "one message = one step" prompt a good reply is well under
// this; the cap just stops a runaway wall (which would cut mid-word and drift next turn).
const MAX_REPLY_TOKENS = 384;
// Hidden seed that makes the tutor speak first (never shown to the student).
const OPENING_SEED =
  "Please begin the lesson: greet me warmly in a sentence, say briefly what we'll cover, and ask your first diagnosing question.";

// Globally-unique id: a module counter would reset to 0 on reload and collide with the
// ids in a restored transcript.
function nextId(): string {
  return crypto.randomUUID();
}

function stripMarker(text: string): string {
  return text.replace(READY_MARKER_RE, "").trimEnd();
}

// What the student sees: marker removed + stray leading punctuation trimmed (small models
// occasionally start a reply with a lone "?"/"."/":" etc.).
function cleanReply(text: string): string {
  return stripMarker(text).replace(/^[\s?!.,:;)\]}·•—–-]+/, "");
}

function countStudentTurns(messages: TutorMessage[]): number {
  return messages.filter((m) => m.role === "user").length;
}

export function useTutor(systemPrompt: string, sessionKey: string): UseTutor {
  // Start empty so server and first client render match (localStorage isn't available
  // during SSR). The saved transcript is restored in an effect after mount.
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [status, setStatus] = useState<TutorStatus>("idle");
  const [loadProgress, setLoadProgress] = useState<LoadProgress>(null);
  const [error, setError] = useState<string | null>(null);
  const [testUnlocked, setTestUnlocked] = useState(false);
  const [modelLabel, setModelLabel] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const studentTurnsRef = useRef(0);
  const startedRef = useRef(false);

  // Restore this lesson's saved transcript after mount (client only — reading
  // localStorage during render breaks SSR hydration). Runs before the auto-open effect
  // in LessonChat, so a restored lesson does NOT re-run the opening.
  useEffect(() => {
    const saved = readTranscript(sessionKey);
    if (saved.length === 0) {
      return;
    }
    startedRef.current = true;
    studentTurnsRef.current = countStudentTurns(saved);
    // Re-id on restore so any stale/duplicate ids from older saves can't collide.
    setMessages(saved.map((m) => ({ ...m, id: nextId() })));
    if (studentTurnsRef.current >= ENGAGEMENT_FLOOR) {
      setTestUnlocked(true);
    }
  }, [sessionKey]);

  // Persist only stable (completed) transcripts — never mid-stream partials, so a
  // half-streamed message can't be saved and later restored as garbled text.
  useEffect(() => {
    if (status === "ready" && messages.length > 0) {
      saveTranscript(sessionKey, messages);
    }
  }, [status, messages, sessionKey]);

  // Instant-start, two-tier: boot a tiny model so teaching begins in seconds, then swap up
  // to the full model once it has finished downloading (prefetched to cache during
  // onboarding). Called before every turn, so the swap lands at a safe boundary.
  const ensureModel = useCallback(async (): Promise<void> => {
    const full = selectModel();
    const tiny = instantModelFor(full);
    if (isModelLoaded(full.id)) {
      setModelLabel(full.label);
      return; // already on the full model (returning user or already upgraded)
    }
    // No two-tier for small models: just load the one model.
    if (tiny.id === full.id) {
      setStatus("loading-model");
      await loadModel(full, (p) => setLoadProgress(p));
      setModelLabel(full.label);
      return;
    }
    // Full weights are cached (download finished) → load/upgrade to it now.
    if (await isCached(full)) {
      setStatus("loading-model");
      try {
        await loadModel(full, (p) => setLoadProgress(p));
        setModelLabel(full.label);
        return;
      } catch {
        // Corrupt/failed full → fall through and keep teaching with the tiny model.
      }
    }
    // Full still downloading → serve instantly with the tiny model.
    if (isModelLoaded(tiny.id)) {
      setModelLabel(tiny.label);
      return;
    }
    setStatus("loading-model");
    await loadModel(tiny, (p) => setLoadProgress(p));
    setModelLabel(tiny.label);
  }, []);

  // Tutor speaks first: greet + open the lesson. Runs once per lesson session.
  const start = useCallback(async (): Promise<void> => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;
    setError(null);
    try {
      await ensureModel();
    } catch (e) {
      startedRef.current = false;
      setError(`Couldn't load the tutor model: ${(e as Error).message}`);
      setStatus("idle");
      return;
    }

    const assistantId = nextId();
    setMessages([{ id: assistantId, role: "assistant", text: "" }]);
    setStatus("opening");
    const history: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: OPENING_SEED },
    ];
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      await chat(history, {
        abortSignal: ac.signal,
        maxTokens: MAX_REPLY_TOKENS,
        onToken: (full) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, text: cleanReply(full) } : m,
            ),
          );
        },
      });
    } catch (e) {
      if (!ac.signal.aborted) {
        setError(`Generation failed: ${(e as Error).message}`);
      }
    } finally {
      abortRef.current = null;
      setStatus("ready");
    }
  }, [ensureModel, systemPrompt]);

  const send = useCallback(
    async (text: string): Promise<void> => {
      const trimmed = text.trim();
      if (
        !trimmed ||
        status === "thinking" ||
        status === "loading-model" ||
        status === "opening"
      ) {
        return;
      }
      setError(null);

      const userMsg: TutorMessage = { id: nextId(), role: "user", text: trimmed };
      const assistantId = nextId();
      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: assistantId, role: "assistant", text: "" },
      ]);

      try {
        await ensureModel();
      } catch (e) {
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        setError(`Couldn't load the tutor model: ${(e as Error).message}`);
        setStatus("idle");
        return;
      }

      // Cap prefill cost on CPU: only send recent turns, and keep the system prompt
      // stable (inject any per-turn skill as a trailing note so the prefix can be cached).
      const turnSteer = steerForTurn(trimmed);
      const recent = messages.slice(-HISTORY_LIMIT);
      const history: ChatMessage[] = [
        { role: "system", content: systemPrompt },
        ...recent.map((m) => ({ role: m.role, content: m.text })),
        ...(turnSteer
          ? [{ role: "system" as const, content: `For your next reply: ${turnSteer}` }]
          : []),
        { role: "user", content: trimmed },
      ];
      setStatus("thinking");

      const ac = new AbortController();
      abortRef.current = ac;
      try {
        const finalRaw = await chat(history, {
          abortSignal: ac.signal,
          maxTokens: MAX_REPLY_TOKENS,
          onToken: (full) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, text: cleanReply(full) } : m,
              ),
            );
          },
        });
        // Settle the FINAL reply: drop any cut-off fragment (so it isn't continued next
        // turn), then verify arithmetic. Streaming stays raw; only the settled text changes.
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, text: trimDangling(verifyReply(cleanReply(finalRaw))) }
              : m,
          ),
        );
        studentTurnsRef.current += 1;
        const sawMarker = stripMarker(finalRaw) !== finalRaw.trimEnd();
        if (sawMarker || studentTurnsRef.current >= ENGAGEMENT_FLOOR) {
          setTestUnlocked(true);
        }
      } catch (e) {
        if (!ac.signal.aborted) {
          setError(`Generation failed: ${(e as Error).message}`);
        }
      } finally {
        abortRef.current = null;
        setStatus("ready");
      }
    },
    [ensureModel, messages, status, systemPrompt],
  );

  const stop = useCallback((): void => {
    abortRef.current?.abort();
    setStatus("ready");
  }, []);

  // Wipe the model cache AND this lesson's transcript, then re-open from scratch.
  const reset = useCallback(async (): Promise<void> => {
    abortRef.current?.abort();
    setError(null);
    try {
      await resetCache();
    } catch (e) {
      setError(`Couldn't clear the cache: ${(e as Error).message}`);
    }
    clearTranscript(sessionKey);
    studentTurnsRef.current = 0;
    startedRef.current = false;
    setMessages([]);
    setLoadProgress(null);
    setTestUnlocked(false);
    setStatus("idle");
  }, [sessionKey]);

  return {
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
  };
}
