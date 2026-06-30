// Per-student profile (name/preferences), stored locally. Powers the tutor remembering
// the student across lessons — the name-preference + personalization behaviors.
// The first piece of the behavioral engine: detect a situation, then steer the prompt.

import type { Track } from "@/lib/syllabus";

export type StudentProfile = {
  name?: string;
  track?: Track;
};

const KEY = "openmaestro:profile";

export function readProfile(): StudentProfile {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as StudentProfile) : {};
  } catch {
    return {};
  }
}

export function saveProfile(profile: StudentProfile): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    // Non-fatal: personalization just won't persist.
  }
}

// Pure: detect an explicit name preference ("call me Liz"). Returns the name or null.
// Deliberately narrow ("call me" / "my name is") to avoid false positives like
// "I'm confused".
export function detectName(text: string): string | null {
  const m = text.match(
    /\b(?:call me|my name is|please call me)\s+([A-Za-z][A-Za-z'-]{0,20})/i,
  );
  if (!m) {
    return null;
  }
  const raw = m[1];
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}
