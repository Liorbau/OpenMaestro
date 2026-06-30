// Per-lesson chat transcripts, persisted in the browser so conversations survive
// switching lessons/courses and reloads. $0, local, no server. See CLAUDE.md "Scaling".
import type { TutorMessage } from "./use-tutor";

function storageKey(sessionKey: string): string {
  return `openmaestro:chat:${sessionKey}`;
}

export function readTranscript(sessionKey: string): TutorMessage[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(storageKey(sessionKey));
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TutorMessage[]) : [];
  } catch {
    return [];
  }
}

export function saveTranscript(
  sessionKey: string,
  messages: TutorMessage[],
): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(storageKey(sessionKey), JSON.stringify(messages));
  } catch {
    // Storage full/blocked — losing persistence is non-fatal.
  }
}

export function clearTranscript(sessionKey: string): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(storageKey(sessionKey));
}
