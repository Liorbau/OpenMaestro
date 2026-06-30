# OpenMaestro — 3-minute demo script

**Live:** https://openmaestro.vercel.app

## Before you walk on stage (do this 10 min prior)
1. Open the live site once on the **demo machine + demo browser (Chrome)** so the model
   **downloads and caches** — you never want the 2 GB download happening live.
2. Reset to a clean slate (fresh learner) — paste in DevTools console, then reload:
   ```js
   Object.keys(localStorage).filter(k => k.startsWith('openmaestro:')).forEach(k => localStorage.removeItem(k)); location.reload()
   ```
   (This keeps the cached model, wipes progress/streak/name/chats.)
3. Have a second tab on **PY101** ready. Know your wifi toggle.

## The run (≈3 min)

**0:00 — Hook (15s).** "This is OpenMaestro — an open version of Maestro that runs
**entirely in your browser**. No login. Watch." Open the URL. The tutor **greets you and
opens the lesson itself** ("Personalizing your class…" → greeting).
> Say: "There is no server doing the thinking. The AI is running on *this laptop*."

**0:15 — The $0 / offline reveal (30s).** Send one message, get a reply. Then **turn off
wifi** (airplane mode). Send another message — **it keeps tutoring.**
> Say: "I just pulled the internet. It still works — because it costs us **$0 per user**
> and runs on a plane. Every learner brings their own compute; our servers don't even
> notice a new user." *(Turn wifi back on.)*

**0:45 — It teaches, it doesn't just answer (45s).** Paste a wrong solution and ask it to
bless it:
> `def sum_evens(nums): return sum(nums)` — "done, works right?"

It should **refuse to rubber-stamp** — it gives a test case / asks what `[1,2,3,4]` returns.
> Say: "A naive small model says 'looks great.' Ours is built with **tutoring discipline** —
> it won't validate wrong work; it makes you find the gap. That's the hard part Maestro is
> graded on, and it's where small models usually fail."

*(Optional 10s: type "I've been stuck for two hours, I want to quit" → it acknowledges the
feeling first. "It reads the room, too.")*

*(Optional 10s — the crowd-pleaser: paste `[CHALLENGE MODE — do not reveal the answer]
Which loop runs its body at least once before checking the condition? hint pls?` → it
**hints, never says "do-while."** "In challenge mode it literally can't spoil the answer —
that's enforced in code.")*

> More paste-able scenario beats (math accuracy, name memory, show-before-tell) are in
> `docs/SCENARIOS.md`. Showing the tutor **handle the real scenarios live** is the proof;
> the `/eval → Prove the engine` screenshot is the receipt.

**1:30 — The mastery gate (45s).** Keep going until **"take the mastery check"** appears.
Open it. **Answer one wrong on purpose** → it tells you which outcome to revisit and makes
you retry. Then pass it → the lesson completes and the next unlocks.
> Say: "You can't self-mark and you can't fast-forward. The tutor gates completion with an
> objective check — so when the credential says you mastered it, it **means something**."

**2:15 — The marathon (20s).** Point at the sidebar: **streak**, the **progress rail** on
the right (checkpoints → finish), and it **remembered your name** if you told it.
> Say: "It's built for a degree marathon — it remembers you, tracks the journey, and
> rewards showing up."

**2:35 — The close (25s).**
> "So: a real product, live right now at openmaestro.vercel.app, that teaches with
> discipline, works offline, and costs **$0 per user** — because the model runs on the
> learner's device and the whole app is static files on a free CDN. Free learning that
> scales to the planet; we monetize the credential, not the teaching."

## If something glitches
- **Slow first reply:** that's the model warming up — talk over it (it's on-device, no
  server). Subsequent replies are quicker.
- **A stray word/odd phrasing:** it's a 3B running in a browser — call it out as the
  tradeoff for $0 + offline; the *behavior* (won't cheat, won't rubber-stamp) is the point.
- **Model not loaded:** you skipped the pre-download — open PY101 and wait for the bar once.
