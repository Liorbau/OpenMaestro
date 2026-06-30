// Per-device learner progress, stored in the browser (localStorage) — $0, offline,
// no server. Replaces the toy's server-disk progress. See CLAUDE.md "Scaling".

export type Progress = {
  completedLessonIds: string[];
  updatedAt: string;
};

const EPOCH = new Date(0).toISOString();

export function emptyProgress(): Progress {
  return { completedLessonIds: [], updatedAt: EPOCH };
}

function storageKey(courseId: string): string {
  return `openmaestro:progress:${courseId}`;
}

// --- Pure core (unit-tested) ---------------------------------------------------

export function parseProgress(raw: string | null): Progress {
  if (!raw) {
    return emptyProgress();
  }
  try {
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return {
      completedLessonIds: Array.isArray(parsed.completedLessonIds)
        ? parsed.completedLessonIds.filter((id): id is string => typeof id === "string")
        : [],
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : EPOCH,
    };
  } catch {
    // Corrupted entry → start clean rather than crash.
    return emptyProgress();
  }
}

// The learning frontier: index of the first not-yet-completed lesson (or the last
// index when everything is done). Lessons at or before the frontier are unlocked;
// later ones are locked. Independent of which lesson is currently open.
export function frontierIndex(
  lessonIds: string[],
  completedIds: string[],
): number {
  const completed = new Set(completedIds);
  const firstIncomplete = lessonIds.findIndex((id) => !completed.has(id));
  if (firstIncomplete === -1) {
    return Math.max(0, lessonIds.length - 1);
  }
  return firstIncomplete;
}

export function withCompleted(
  progress: Progress,
  lessonId: string,
  now: string,
): Progress {
  if (progress.completedLessonIds.includes(lessonId)) {
    return progress;
  }
  return {
    completedLessonIds: [...progress.completedLessonIds, lessonId],
    updatedAt: now,
  };
}

// --- localStorage wrappers -----------------------------------------------------

export function readProgress(courseId: string): Progress {
  if (typeof window === "undefined") {
    return emptyProgress();
  }
  return parseProgress(window.localStorage.getItem(storageKey(courseId)));
}

export function markComplete(courseId: string, lessonId: string): Progress {
  const next = withCompleted(
    readProgress(courseId),
    lessonId,
    new Date().toISOString(),
  );
  if (typeof window !== "undefined") {
    window.localStorage.setItem(storageKey(courseId), JSON.stringify(next));
  }
  return next;
}
