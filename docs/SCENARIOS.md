# Live scenario showcase — show it teaching, don't cite a number

The TutorBench scenarios are the failures where Maestro slips. Instead of putting a score
on a slide, **make the tutor handle them live, in the real product.** Each one below is a
line you paste into any lesson chat (PY101 works for all of them — the per-turn skills fire
on the student's message, not the lesson). Do 3–4 in the demo; keep the rest in your pocket.

> The receipt for the rest: **`/eval` → "Prove the engine"** runs all 20 with and without the
> engine and shows the lift, scenario by scenario. Screenshot it for the deck (running it
> live takes minutes). This is the "we measured it" proof — nobody else brings one.

---

## The four to show live (the punchy ones)

### 1. Won't rubber-stamp wrong work  · (SWE-01)
**Paste:** `def sum_evens(nums): return sum(nums)` — done, works right?
**Watch:** it does **not** say "looks good" — it asks what `[1,2,3,4]` returns, or gives a
test case, and makes you find the gap.
**Say:** "A naive small model rubber-stamps this. Ours refuses — it makes you discover the
bug. That's tutoring, not autocomplete."

### 2. Won't leak the answer in a challenge  · (SWE-03)
**Paste:** `[CHALLENGE MODE — do not reveal the answer] Which loop runs its body at least once before checking the condition? hint pls?`
**Watch:** it gives a **hint** ("here's a hint… where does the condition sit?") and asks
which fits — it never says "do-while." (A deterministic guard makes leaking impossible.)
**Say:** "In challenge mode it *cannot* spoil the answer — that's enforced in code, not just
asked of the model."

### 3. Reads the room (distress)  · (SWE-09)
**Paste:** I've been stuck on this same bug for two hours and I'm about to quit the whole program.
**Watch:** it **acknowledges the feeling first** ("two hours on one bug is draining, that's
normal…") before any content, then offers a small next step.
**Say:** "It attunes to the student before diving into content — the difference between a tool
and a tutor."

### 4. Gets the math right  · (BIZ-02)
**Paste:** costs $40 to make, sells at $50 — what's the gross margin %?
**Watch:** it states **20%** (margin over *price*, not cost). A deterministic calculator
verifies the number after the model writes it.
**Say:** "Small models fumble arithmetic. We check every number in code — so it's right,
for free, offline."

---

## In your pocket (if asked / time permits)

| Paste this | Handles (scenario) | Watch for |
|---|---|---|
| call me Liz, not Elizabeth. ok let's go | Name preference (BIZ-10) | Uses "Liz" immediately |
| I have no business background and everyone gets this instantly — I feel behind. | Empathy (BIZ-09) | Feeling acknowledged before content |
| how would I know how to do recursion if you never showed me one? | Scaffolding (SWE-06) | Shows a worked example *first*, then asks |
| ready (right after "ready to dig into HTTP headers?") | Explain-before-quiz (SWE-05) | Explains with an analogy first, doesn't quiz |
| just give me a one-liner I can paste and run | Placeholder syntax (SWE-07) | Gives `print("Hello, world!")` directly |
| For PM software, TAM is roughly $60B globally. | Lost-track / method (BIZ-04) | Accepts it, asks *how* (top-down/bottom-up) |

---

## The one-line framing

> "Same tiny model, on your device, $0. Without our engine it's a mediocre chatbot; with it,
> it handles the exact situations Maestro is graded on — and here's the reproducible eval
> that proves the lift." *(show `/eval → Prove the engine`)*

If a reply has a stray word or wobbles, own it: "It's a 3B in a browser — that's the price of
free + offline. The **behavior** — won't cheat, won't rubber-stamp, catches the math — is the
moat, and it's measured."
