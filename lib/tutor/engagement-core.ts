// Pure, dependency-free core for the local day-streak — the marathon habit signal.
// (XP/levels were removed: with unlimited free learning there's nothing to redeem yet.
// A loyalty tier — levels → discounts on paid extras — belongs with the paid products.)
// IO wrapper lives in engagement.ts. See CLAUDE.md "Engagement & progression".

export type Engagement = {
  streak: number;
  lastActiveDay: string; // "YYYY-MM-DD", or "" if never active
};

export function emptyEngagement(): Engagement {
  return { streak: 0, lastActiveDay: "" };
}

// Previous calendar day for a "YYYY-MM-DD" string (handles month/year rollover).
export function prevDay(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

// Count a study day: same day is a no-op; a consecutive day extends the streak; a gap
// resets it to 1.
export function recordActivity(e: Engagement, today: string): Engagement {
  if (e.lastActiveDay === today) {
    return e;
  }
  const streak = e.lastActiveDay === prevDay(today) ? e.streak + 1 : 1;
  return { streak, lastActiveDay: today };
}
