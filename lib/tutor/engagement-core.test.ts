// Runnable check for the streak core. Run: node lib/tutor/engagement-core.test.ts
import assert from "node:assert/strict";
import { emptyEngagement, prevDay, recordActivity } from "./engagement-core.ts";

// prevDay handles rollover
assert.equal(prevDay("2026-07-01"), "2026-06-30", "day rollover");
assert.equal(prevDay("2026-03-01"), "2026-02-28", "month rollover");
assert.equal(prevDay("2026-01-01"), "2025-12-31", "year rollover");

// recordActivity streak logic
let e = recordActivity(emptyEngagement(), "2026-07-01");
assert.equal(e.streak, 1, "first day -> 1");
assert.equal(recordActivity(e, "2026-07-01"), e, "same day is a no-op");
e = recordActivity(e, "2026-07-02");
assert.equal(e.streak, 2, "consecutive -> 2");
e = recordActivity(e, "2026-07-05");
assert.equal(e.streak, 1, "gap resets to 1");

console.log("engagement-core.test: all assertions passed ✓");
