# OpenMaestro — 10-minute presentation

One slide per section. Each has the **on-slide content** and *speaker notes*. Timings sum
to ~10 min (≈3 of which is the live demo).

---

## 1 · Title (0:30)
**OpenMaestro**
*An open Maestro that teaches anyone, anywhere — for $0 per user.*
Live: openmaestro.vercel.app

*Notes:* "Masterschool wants to be the biggest school in the world. That means a product
anyone, on any device, can use — at no cost per user. Here's a working one."

---

## 2 · The mission & the one hard rule (1:00)
- Build an **open, end-to-end** Maestro that reaches everyone.
- **The one rule: $0 COGS.** No cloud LLM bill per lesson, no per-user server.
- So the model must run **on the user's own device**.

*Notes:* "The hard constraint isn't features — it's cost. It can't cost us money when a new
user shows up. That single rule drives every decision."

---

## 3 · The tension nobody escapes (1:00)
- $0 forces a **small, on-device model.**
- But we're graded on **teaching quality** — 20 real scenarios where Maestro slips.
- Small models are mediocre tutors. **This is where you win or lose.**

*Notes:* "If you just wire a small browser model to a chat box, you get a worse ChatGPT.
The whole game is making a small model *teach well*."

---

## 4 · The insight (1:00)
- The 20 scenarios aren't **knowledge** tests — they're **behavior** tests.
- "Don't leak the answer." "Don't rubber-stamp wrong work." "Catch the discouraged
  student." "Remember she's Liz."
- A small model fails these for lack of **discipline, not IQ** — and discipline we can
  *engineer*.

*Notes:* "This reframed everything. We don't need a smarter brain; we need a disciplined
one. That's tractable on a small model — and it turns our constraint into a strength."

---

## 5 · Architecture — $0 by design (1:00)
- Tutor runs in the browser via **wllama (llama.cpp / WASM)** — CPU, any device.
- App + lessons + quizzes = **static files on a free CDN.**
- Model weights = **Hugging Face's CDN**, then **browser-cached** (downloaded once).
- Progress, streak, chats = **local storage.** **No server. No database.**

*Notes:* "Every new user brings their own compute. Our servers don't notice them. That's
why it's genuinely $0 and scales to the planet on a free tier."

---

## 6 · The teaching engine (1:00)
- **Always-on discipline** in the prompt (signal shifts, show-before-tell, don't dump answers).
- **Per-turn skills** fire on the moment: distress → empathy; "is this right?" → don't
  rubber-stamp; math → be exact.
- **Mastery gate:** an objective MCQ quiz the *tutor* opens — no self-marking, unique every
  attempt, must pass to advance.
- **Remembers the student** (name, progress) — built for a marathon.
- **We measured it.** `/eval → "Prove the engine"` runs all 20 scenarios *with and without*
  the engine and shows the lift, scenario by scenario — same brain, our discipline layer is
  what makes it teach well.

*Notes:* "We don't just claim it teaches well — here's the receipt: same model, same
scenarios, our engine handles the ones it otherwise fumbles. And I'll show it handling the
real scenarios live, which beats any slide."

---

## 7 · LIVE DEMO (3:00)
→ Follow `docs/DEMO.md`; scenario beats to paste live are in `docs/SCENARIOS.md`.
Beats: greets you → **pull wifi, still teaches** → **won't bless wrong code** → **won't leak
a challenge answer** → **mastery quiz gates you** → streak / remembers your name.

*Notes:* Pre-download the model beforehand. If a reply is slow, talk over it — it's on-device.
Show the tutor *handling the actual TutorBench scenarios* live — that beats any number on a
slide, and the `/eval` receipt (screenshot) backs it.

---

## 8 · Scale & business model (1:00)
- **$0 per user**, forever — the expensive part (AI) is on the device.
- Free hosting scales to millions (static files).
- **Business model the architecture enables:** learning is **free**; the **credential**
  (the "stamp") is paid; premium **exam-prep / marathons** are paid. Loyalty tiers later.

*Notes:* "Because teaching costs us nothing, we can give it away and charge only for what's
scarce — the credential. Tech and business reinforce each other."

---

## 9 · What's built + honest limits (0:45)
- Built & live: on-device tutor · offline · progress · mastery quiz · behavioral engine ·
  3 courses (Python, Business, Frontend).
- Honest: it's a **3B on CPU** — occasional quirk, and first load downloads once. The
  *behavior* is the moat, not raw polish.

*Notes:* "I'd rather show you a real thing with real tradeoffs than a demo that only works
on my machine."

---

## 10 · Close (0:45)
- A real product, **live today**, anyone can open.
- Teaches with discipline, works offline, **$0 per user.**
- *"Everyone, everywhere, in great quality."*

*Notes:* "That was the north star. It's running right now at openmaestro.vercel.app —
open it on your phone."
