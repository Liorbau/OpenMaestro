// Local streak store, persisted in the browser. $0, no server.
import {
  type Engagement,
  emptyEngagement,
  recordActivity,
} from "./engagement-core";

const KEY = "openmaestro:engagement";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function readEngagement(): Engagement {
  if (typeof window === "undefined") {
    return emptyEngagement();
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      return emptyEngagement();
    }
    const parsed = JSON.parse(raw) as Partial<Engagement>;
    return {
      streak: typeof parsed.streak === "number" ? parsed.streak : 0,
      lastActiveDay: typeof parsed.lastActiveDay === "string" ? parsed.lastActiveDay : "",
    };
  } catch {
    return emptyEngagement();
  }
}

// Mark that the student showed up today (updates the streak). Returns the new state.
export function touchToday(): Engagement {
  const next = recordActivity(readEngagement(), today());
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Non-fatal.
    }
  }
  return next;
}
