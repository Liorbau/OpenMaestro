# Tutor prompts — where the model's instructions live

OpenMaestro has **no `prompt.md`** — the prompts are **built in code**, per lesson, so they
can be course- and lesson-aware. Every piece of prompt text is one of these:

| Prompt piece | Where (click to open) | What it holds |
|---|---|---|
| **Main system prompt** | [`lib/tutor/prompt.ts` → `buildSystemPrompt()`](../lib/tutor/prompt.ts#L7) | The always-on instructions: course outline + current position, the lesson's mastery outcomes, the "How to teach" rules (explain/answer by default, withhold only when gated, show-before-tell, signal shifts), tone, formatting, name-addressing, and the `<<READY>>` mastery signal. |
| **Per-turn skills** | [`lib/tutor/skills.ts` → `SKILLS`](../lib/tutor/skills.ts#L45) | The focused instruction injected for a detected moment — distress → empathy, challenge → nudge, submission → don't rubber-stamp, math → be exact, explain-first, scaffold, estimate, name-preference. |
| ↳ detection | [`lib/tutor/skills.ts` → `DETECTORS`](../lib/tutor/skills.ts#L18) | The cheap regex detectors that decide which skill fires. |
| ↳ assembly | [`lib/tutor/skills.ts` → `steerForTurn()`](../lib/tutor/skills.ts#L77) | Builds the per-turn note appended to the system prompt for that reply. |
| **Opening seed** | [`lib/tutor/use-tutor.ts` → `OPENING_SEED`](../lib/tutor/use-tutor.ts#L58) | The hidden line that makes the tutor greet the student and open the lesson first (never shown to the learner). |
| **Eval — engine prompt** | [`lib/eval/run.ts` → `ENGINE_SYSTEM`](../lib/eval/run.ts#L17) | The engine's discipline, mirrored for the eval harness. |
| **Eval — baseline prompt** | [`lib/eval/run.ts` → `BASELINE_SYSTEM`](../lib/eval/run.ts#L12) | The plain "you are a helpful tutor" — the control the engine is measured against. |

## How they combine on each turn

```
system  = buildSystemPrompt(course, lesson, studentName)   // always-on discipline
        + steerForTurn(studentMessage)                     // one focused skill, if a moment is detected
history = recent turns
user    = the student's message   (or OPENING_SEED for the tutor's first message)
```

So the model sees **one stable system prompt + at most one targeted nudge per turn** — the
behavioral engine is these prompts plus a cheap detector, not a bigger model.
