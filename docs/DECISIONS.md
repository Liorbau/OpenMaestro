# OpenMaestro — Decisions & Design Dossier

The single source of truth for **what we're building, how we meet the requirements, our
business, how we solve problems, and what makes us special.** Kept updated as we make big
calls. (Companion docs: `DEMO.md`, `PRESENTATION.md`. Working context: `../CLAUDE.md`.)

Live: **https://openmaestro.vercel.app**

---

## 1. What we're building
An **open, $0-COGS version of Maestro** (Masterschool's AI tutor). A real, end-to-end
product anyone can open on any device, learn from, and return to.

**North star (non-negotiable):** *Everyone, everywhere, in great quality.*

## 2. Requirements → how we meet them
| Hackathon goal | How OpenMaestro meets it |
|---|---|
| **End-to-end product** | Full flow: onboarding → course/lesson → disciplined tutoring → mastery gate → progress/streak. Live on a public URL. |
| **$0 COGS** | The model runs **on the user's device** (browser). No cloud LLM bill, no per-user server. App + content are static files on a free CDN; weights come from HuggingFace's CDN, cached once. |
| **At scale** | No backend to scale. Every user brings their own compute; static files serve millions on a free tier. |
| **Engaging** | Tutor initiates + personalizes, day-streak, a lesson progress rail, remembers the student, a real mastery quiz. |
| **Teaches well (20 TutorBench scenarios)** | A **behavioral engine** (discipline rules + per-turn skills + mastery gate) that targets the exact failures the scenarios test. Measured by our eval harness. |

## 3. The central bet (what makes us special)
The 20 graded scenarios are **behavior tests, not knowledge tests** ("don't leak the
answer," "don't rubber-stamp wrong work," "catch the discouraged student," "remember
she's Liz"). A small model fails these for lack of **discipline, not IQ** — and discipline
we can **engineer**. So we don't chase a bigger brain; we wrap a small one in a policy
layer. **This turns the $0 constraint (small on-device model) into a strength**, and it's
why we can teach well *and* stay free. Nobody else can easily do a $0 AI product because
they keep the model on a server; we moved it to the device.

## 4. Architecture decisions
- **Runtime = wllama (llama.cpp / WASM), CPU.** Wins the "runs anywhere" fight; WebGPU is
  flaky (aborts on Metal) so we force CPU (`n_gpu_layers: 0`). Model chosen by device tier.
- **Model registry** (`lib/llm/registry.ts`): swapping a model is swapping an id; auto
  tier-selection for students, `?model=` dev override, and it powers the eval bake-off.
- **Everything static.** App + lessons + quizzes are bundled/static → deployable to a free
  CDN. Weights from HF's CDN, browser-cached (downloaded once, kept via `storage.persist()`).
- **No backend, no database.** Progress, streak, chats, profile all live in the browser
  (localStorage / OPFS). Course switching is client-side (no reload).
- **Offline** via a service worker (production) — after first load it works with no network.
- **Instant-start** attacks the one real on-device weakness (multi-GB first load): the model
  is **prefetched the moment the app opens** (overlaps onboarding), and on a big-model device
  a **tiny 1B boots first** so teaching begins in seconds while the full 3B streams to disk
  (single instance — the tiny is swapped out, not held alongside, so no extra RAM), then it
  **silently upgrades** at the next turn. Returning users skip the tiny and load full from cache.
- **Adapter seam** (`generate()`): the backend is swappable; we'd only add web-llm if a
  measurement proved the need (it hasn't).

## 5. The teaching engine (the differentiator)
Hybrid, decided with the founder:
- **Always-on discipline** (system prompt): diagnose first, one concept at a time, signal
  every shift, show-before-tell, be exact, never dump the answer, cover every outcome.
- **Situational, not blindly Socratic** (tuned via the eval): the
  engine EXPLAINS a concept / ANSWERS a factual question directly by default, and withholds
  ONLY when the student is meant to produce the answer (challenge, submission, "just give it").
- **Per-turn skills** (`lib/tutor/skills.ts`): cheap deterministic detection injects ONE
  focused instruction per moment — verified to route correctly for all 20 scenarios:
  name-preference, distress→empathy, challenge→nudge, modeShift→signal the transition,
  explainFirst→lead with a definition, scaffold→show a worked example, estimate→probe the
  method, submission→don't rubber-stamp (probe if wrong, edge-case if right), directAnswer→
  nudge (but give plain syntax), math→write `expr = result` and state the number.
- **Mastery gate:** the *tutor* opens an objective **MCQ quiz** (no self-marking, unique
  every attempt via shuffle + distractor pools + parameterized templates, strict all-pass).
  Unlock = tutor senses readiness OR an engagement floor (so a learner can never get stuck).
- **Memory:** detects a stated name and persists it; injected into every prompt.
- **Verifier** (`lib/tutor/verify.ts`): a $0 deterministic pass over the model's *finished*
  reply. (a) Recomputes every arithmetic claim — including prose form (`17 % 5 is 0.4` → `2`),
  not just equations — and corrects a wrong number (verify with cheap code, not a bigger
  brain). (b) `redactLeak` backstops challenge mode: if the withheld answer appears, it's
  replaced with a safe nudge, so the tutor **can't** spoil. (c) `trimDangling` drops a
  cut-off fragment. Conservative: skips hedged/unparseable claims → never introduces an error.
- **Assessor fallback** (`lib/tutor/assessor.ts`): for lessons without an authored quiz, a
  strict fail-closed model-judged check gates completion.

## 6. Content model
Adopted Maestro's shape (from the reference repo): a course = `{ id, title, track,
lessons: [{ id, title, outcomes[], quiz? }] }`. Lessons are **outcome-based** (no prose
body) — the model teaches from outcomes + its knowledge, so heavy RAG is unnecessary.
Quizzes are **authored** (deterministic quality) in three kinds: fixed, pooled (sample
distractors), and template (code generates values + computes the answer). Courses: **Python
101, Business 101, Frontend Foundations.**

## 7. Engagement & progression
- **Onboarding:** a dark, cinematic hero (starfield + a rotating 3D Earth via self-hosted
  three.js, Newsreader wordmark) → name → pick a **degree** (Business / SWE) → sidebar shows
  only that degree's courses. The globe is the "AI higher education for ALL, wherever you
  are" metaphor made visual; three + the Earth texture are **self-hosted** (same-origin,
  offline-friendly, no dependency), and it degrades to starfield + wordmark if WebGL fails.
- **Streak** (kept — meaningful on its own). **XP/levels dropped** — hollow with unlimited
  free learning (level just mirrored lessons done). *Future:* levels = loyalty status →
  discounts on paid extras, once paid products exist.
- **Personalization:** the tutor greets the student **by name from its opening message**
  (name is captured at onboarding and threaded into the first prompt), remembers a name
  said mid-lesson ("call me …"), and initiates each lesson.
- **Control center** (slide-over overlay, not a route — keeps the on-device model hot):
  degree + overall progress, a course switcher, and settings (edit name). Reached from the
  sidebar. The sidebar lesson list shows a **green/yellow/red difficulty dot** per lesson
  (a stable mostly-medium cycle, 3 medium : 1 easy : 1 hard, offset per course so every
  course shows the spread — outcome count clustered everything on medium).

## 8. Business model (the architecture enables it)
- **Learning is free** — teaching costs us $0 (on-device), so we give it away.
- **The credential ("stamp") is paid** — hard, demanding tests mean only those who truly
  understand pass; priced below a real university.
- **Premium extras** (exam-prep marathons, etc.) are paid; a loyalty tier comes later.
- Tech and business reinforce each other: revenue comes from credentialing + extras, never
  from per-lesson inference.

## 9. How we measure (eval)
`/eval` runs the 20 scenarios through any registered model and scores each with a
**deterministic rubric** (the specific failure each tests — no LLM judge → $0/offline).
Runs use **greedy, single-thread decoding** with independent scenarios so a run is stable.
A **bake-off** downloads every candidate, runs all 20, and ranks them — so model choice is a
measurement, not a guess. **"Prove the engine"** runs the same model with and without the
engine and shows the lift per scenario — the receipt that our teaching layer, not a bigger
brain, is what wins. **Chosen default model: Qwen2.5-3B** (settled by the bake-off); a 1B is
the instant-boot stopgap only.

## 10. Problems we hit & how we solved them
- **>2 GB single file won't load in-browser** (ArrayBuffer limit) → keep models <2 GB or
  ship as shards; the demo tier is a 3B (1.93 GB).
- **WebGPU aborts on Metal/Chrome** → force CPU/WASM (`n_gpu_layers: 0`); reliable + fast enough.
- **Growing TTFT / slow replies** → cap history, keep the system prompt stable, and enable
  KV-cache prefix reuse (`n_cache_reuse`).
- **Surprise re-downloads** → `navigator.storage.persist()` so the model isn't evicted.
- **Garbled/split output** → fixed lifecycle bugs (persist only completed messages, unique
  ids, serialized generations) + a stray-leading-punctuation sanitizer.
- **SSR hydration mismatches** → all local state is read after mount, never during render.
- **Eval non-determinism** → greedy alone wasn't enough (multi-thread float reduction flips
  the argmax and cascades); the eval now runs **single-threaded** for true reproducibility.

## 11. Deployment
Deployed to **Vercel** (free tier) at openmaestro.vercel.app. COOP/COEP headers enabled so
wllama can multi-thread; the service worker gives offline in production. Bundled JSON (no
server filesystem) keeps it deploy-safe and static-export-ready.

## 12. Honest limitations
It's a **3B running on CPU in a browser** — occasional quirk, and the first visit downloads
the model once. The **behavior** (won't cheat, won't rubber-stamp, teaches with discipline)
is the moat, not raw polish. Rubrics are consistent proxies, not human graders.

## 13. Working principles
- No big decision made solo — scope, stack, core features, cuts decided together.
- Build lean; the smallest thing that creates the intended "wow"; name what we skip.
- Flag doubts out loud; measure before optimizing; honest tradeoffs over demo-ware.

## 14. Decision log (chronological, big calls)
1. On-device inference via **wllama** as the spine (CPU/WASM), web-llm only if measured.
2. **Behavior-over-IQ** central bet; teaching engine as the star; **no fine-tuning/RL**.
3. **No backend / no rate-limit/proxy** — nothing to scale; static + on-device.
4. Fork-by-absorption of the reference tutor; **TypeScript / Next.js** (static-export).
5. Offline + browser-persisted progress (service worker + localStorage).
6. **Mastery gate = authored MCQ**, tutor-gated, unique per attempt; assessor fallback.
7. Hybrid behavioral engine (baseline rules + per-turn skills) + name memory.
8. **Deployed** to Vercel; engagement = streak (XP/levels dropped).
9. **Onboarding** with name + degree; degree-filtered courses.
10. **Eval harness** (deterministic, plug-and-play bake-off) to choose the model by data.
11. **Maestro branding** (shield logo + serif wordmark) across the product.
12. **Control center** as a slide-over overlay (keeps the model hot); per-lesson difficulty dots.
13. **Verifier** in the engine — deterministic $0 checks correct the model's own arithmetic
    (verify with code, not a bigger model). Applied in the product + engine-mode eval.
14. **Instant-start** — prefetch during onboarding + a tiny-model-first boot that silently
    upgrades to the full model (single instance, low RAM), so "anyone anywhere" isn't gated
    on a multi-GB download.
15. **Eval-as-proof** ("Prove the engine": baseline vs engine, per scenario) + **Qwen2.5-3B**
    chosen as the default by the deterministic bake-off.
16. **Concise-reply fix** — "one message = one step" + token cap + trim cut fragments, ending
    the last-token drift (walls hit the cap, cut mid-word, got continued next turn).
17. **Cinematic landing** — dark starfield + rotating 3D Earth (self-hosted three.js),
    Newsreader/Wix Madefor fonts; the "for ALL, wherever you are" north star made visual.
