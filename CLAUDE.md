<!-- captain:begin AI engineering policy (managed - do not edit inside) -->
# Engineering Ownership Protocol

This repository uses AI coding agents, but the human engineer owns the system design, tradeoffs, and final decisions.

## Before implementation

Before writing code:
- Restate the task in your own words.
- Identify affected files, modules, APIs, data models, or workflows.
- Identify meaningful design decisions.
- Present 2-4 options for important architecture or product decisions. (use the multiple-choice question tool, e.g. AskUserQuestion in Claude Code)
- Recommend one option, but wait for human approval before implementing high-impact decisions.
- Do not begin large implementation without an approved plan.

## During implementation

When writing code:
- Prefer small, reviewable diffs.
- Change at most 3 files or around 150 lines before pausing, unless explicitly approved.
- Implement step by step.
- Explain why each changed file is needed.
- Avoid unnecessary abstractions.

## Quality gates

For behavior changes:
- Add or update tests.
- Run relevant lint, typecheck, and tests when possible.
- If commands cannot be run, explain why.
- Call out hidden assumptions.
- Call out edge cases and failure modes.
- Call out security, privacy, performance, or migration risks when relevant.

## Human decision points

Pause and ask for human input before deciding:
- system architecture
- data model changes
- API contracts
- database migrations
- authentication or authorization behavior
- error-handling strategy
- major dependency additions
- irreversible or hard-to-migrate choices

## After implementation

After coding:
- Summarize changed files.
- Explain the final design.
- Explain how to verify behavior.
- List tests run.
- List remaining risks or TODOs.
- For non-trivial tasks, ask 1-3 questions to check that the human understands the implementation.
<!-- captain:end -->

---

# OpenMaestro — Project Context (living doc, keep updated)

## What we're building
An **open, $0-COGS version of Maestro** (Masterschool's AI tutor). A real end-to-end
product anyone can open on any device, learn from, and return to. Solo build.

## Key files
- `scope/Hackathon_Maestro_Open.md` — the official brief (source of truth for rules).
- `scope/scenarios.csv` — **the 20 graded scenarios** (10 Biz + 10 SWE). Each row =
  a student prompt + the gold-standard tutor `Answer` + the failure taxonomy it tests.
  **This is our eval set AND our demo script.** Treat it as the behavioral spec.

## North star (non-negotiable)
**Everyone, everywhere, in great quality.** Will not ship without it. No "bonus"
half-tiers — only the best-of-breed tools we truly need, gone 100% on. No over-engineering.

## The one hard rule
**No per-user cloud cost.** The tutor LLM runs on the user's own device via
**web-llm** (mlc-ai). No per-lesson cloud inference bill, no per-user server.

## Constraints & givens
- Use the **existing Maestro LMS lesson structure** — do not invent a content model.
  Source programs (staging): BIZ + AWS/SWE (URLs in Hackathon_Maestro_Open.md).
- Must **teach well**, not just answer right. Graded against **TutorBench: 10 scenarios**
  where Maestro tends to slip (SWE + Biz). This is the quality bar.
- Goals: end-to-end, $0 COGS, at scale, engaging.

## Timeline
- Today: 2026-06-30. **Deadline: 2026-07-04 23:59.** Demo + 10-min presentation 2026-07-05.
- ~4.5 working days, solo (+ Claude).

## Central bet (sharpened after reading scenarios.csv)
The 20 scenarios are **almost entirely behavioral/pedagogical, not knowledge recall.**
The failure taxonomy:
- **Tone & empathy** — preference/name miss; emotional attunement miss (distress cue)
- **Instructional clarity** — unsignaled mode shift; placeholder-syntax confusion
- **Tutor accuracy** — factual/math error; validated wrong work; challenge answer leak;
  lost track / target-switch
- **Pacing & scaffolding** — scaffolding gap (too fast); taught/tested before explaining

A small model fails these not for lack of knowledge but for lack of **tutoring
discipline**. So the lever is NOT raw intelligence — it's a **structured tutoring
policy** that detects the situation (challenge mode? wrong submission? distress cue?
name preference? math?) and steers behavior. This is tractable on a small model because
we constrain behavior, not add IQ. That is how we beat the benchmark AND stay $0-COGS.

## Reference: toy Maestro repo (`../maestro-toy`, github.com/Liorbau/fellowship-tutor)
A clean Next.js 16 + TS + AI SDK 6 tutor = "today's Maestro" in miniature. Studied it.
- **Content model (adopt as-is):** course JSON =
  `{ id, title, description, lessons: [ { id, title, outcomes: string[] } ] }`.
  A lesson = title + **mastery outcomes** (what the learner must demonstrate). **No prose
  body** — the model teaches from outcomes + its own knowledge.
- **Implication:** heavy RAG likely unnecessary (no lesson-text corpus). Accuracy comes
  from model knowledge + tools (calculator) + our gold examples, not a doc store.
- **Their brain = cloud:** `app/api/chat/route.ts` calls `openai("gpt-5.5")` server-side;
  progress saved to server disk. **That's exactly what we must replace.**
- **OpenMaestro in one line:** take this app, swap the cloud brain for on-device wllama,
  move progress to browser storage → static, $0, offline-capable.
- **`complete_lesson` tool gates progression** (model decides mastery, calls it). A small
  model will over-complete (yes-man) → this gate is a prime "don't trust the model alone"
  spot for our teaching engine.
- Stack to inherit: Next.js 16 (App Router), React 19, AI Elements + shadcn/ui + Tailwind
  v4, streamdown (md/code/math), Zod. Pivot inference off AI SDK's cloud provider to wllama.
- **Decided: fork-by-absorption.** Copy the toy's useful code INTO this repo (OpenMaestro
  stays home — all docs/context/session intact); adapt it (swap brain → wllama, progress →
  browser). `../maestro-toy` stays parked as read-only reference. Toy git history irrelevant.

## Tutor behavior (vision)
- **Course-aware, not just lesson-aware:** feed the model the course outline (lesson titles
  + current position) so it connects dots and paces — not too fast, not too slow. Cheap:
  extra context lines, no new machinery.
- **Mastery gate:** the lesson `outcomes` are the targets; tutor verifies each is
  demonstrated before completing. Our engine enforces it (small model won't on its own).
- **Leads but yields:** default to driving the lesson; detect "student asked / is stuck"
  and switch to answering. Same situation-detection as the rest of the engine.

## Offline & multi-device (decided)
- **Offline: YES after first visit.** App + model cached on-device (add a service worker /
  PWA) → full tutoring with zero signal. Only first-load + bonus social need internet.
  Demo moment: pull wifi, keep teaching.
- **Cross-device = staged ladder, not all-or-nothing:**
  1. Core (free/offline): each device its own world.
  2. Cheap bonus (free/offline): **QR/code one-time SNAPSHOT** — "continue where I left off."
     A photo, not a phone line: copies state once, devices drift after. QR holds a few KB →
     fits progress; use copy-paste code / small file for bigger chat history.
  3. Real bonus (needs server + login): live WhatsApp-style sync. (WhatsApp itself relays
     through servers — live sync is impossible fully serverless.)
  - Priority: offline/free is sacred; snapshot = small bonus if time; live sync = later.
    Don't let multi-device pull focus from the teaching engine.

## Quality stack (direction, to confirm next)
- **Skills / behavioral policies = the star** (one per taxonomy branch). Go 100% here.
- **RAG = light/maybe none** — toy shows lessons have no prose body; revisit if real
  Maestro lessons turn out to carry teaching text.
- **Tools = narrow + high-value** — calculator/code-exec for math accuracy (BIZ-02,
  SWE-02); a memory store for student preferences (name, BIZ-10/SWE-10).
- **RL = NO** — scenarios are our eval, not training data. Fine-tuning is a 4.5-day trap.

## Runtime (decided, pending de-risk spike)
Principle: **right weapon per fight, not a target backend count.** Quality is never
capped to stay at one backend; a backend is never added on a hunch.
- **Spine = wllama** (llama.cpp/GGUF): wins the hard low-end fight (best CPU/WASM
  inference), and on WebGPU it runs the same model + scaffolding → no quality cap at the
  high end (web-llm's only edge is invisible tok/s, not teaching quality).
- **Thin adapter** `generate()` so the backend is swappable.
- **Model registry (decided):** a typed `ModelEntry[]` config (`{id,label,url|url[],tier,nCtx}`)
  + one `loadModel(id)` loader. Swapping a model = swapping an id. Buys auto tier-selection
  (probe device → pick entry), the model bake-off (Qwen/Phi/Llama/Gemma on the 20 scenarios),
  and split-shard support (url string-or-array) for free. wllama applies each GGUF's embedded
  chat template, so switching models needs no prompt rewrites. Don't build non-wllama backend
  abstraction on spec — the adapter seam is enough.
- **No student-facing model picker.** Students get auto tier-selection (invisible). Model
  override is **dev-only via URL param** (`?model=<id>`), falling back to auto — ideal for the
  bake-off. (The spike's dropdown is throwaway scaffolding, not product.)
- **Day-1 spike:** run a 7–8B GGUF on the M5 via wllama; measure speed + output quality.
  IF the high end disappoints → drop web-llm in for the WebGPU tier (one-line swap via
  the adapter). Second backend only if a measurement proves the need.
- Rejected: web-llm as spine (WebGPU-only, fails low-end); transformers.js (ONNX CPU
  trails llama.cpp on the decisive low-end fight).

## Spike results (2026-06-30) — wllama VALIDATED ✅
Throwaway spike (`scratchpad/spike.html` + `serve.py`), Qwen2.5 GGUF, Chrome on M5 Pro:
- **Speed:** 1.5B = **64.8 tok/s** on CPU/WASM multi-thread (no WebGPU). ~10× reading speed.
  Cached load = 1.8s. crossOriginIsolated works via COOP + COEP `credentialless`.
- **Baseline quality (raw 1.5B, plain prompt, NO engine) on SWE-01:** *caught the bug*
  ("returns sum of all, not evens") — so the model KNOWS it. But then **dumped the full
  corrected solution + tests + rambled off a cliff.** A knowledgeable yes-man with zero
  Socratic restraint. → Central bet CONFIRMED: the gap is **behavior, not IQ.**
- **API learnings for the build:**
  - `new Wllama({ 'wllama.wasm': URL, 'default': URL })` (v3 single unified wasm).
  - `createChatCompletion({ messages, max_tokens, temperature, top_p, top_k })` →
    `response.choices[0].message.content` (OpenAI-style object, NOT positional args).
  - Single GGUF <2GB loads fine; >2GB single file hits browser ArrayBuffer limit →
    **split into <512MB shards** (`loadModelFromUrl`/`HF` auto-loads chunks from first URL).
  - Serve with COOP `same-origin` + COEP `credentialless` for threads + cross-origin model fetch.
- **3B comparison (same SWE-01, no engine):** **28.1 tok/s**, and pedagogically *much*
  better — caught the bug, **withheld the solution**, nudged, and asked "how would you
  start?" (~80% of gold, 51 tokens). Correction to an earlier guess: **model size DID
  improve Socratic restraint.** Caveat: this is the EASY scenario; engine still earns its
  keep on challenge-leak / subtle-error / distress / math + on *consistency*.
- **Default working model = Qwen2.5-3B-Instruct Q4_K_M** (best behavior-per-GB, single-file
  <2GB load, ~28 tok/s). Final pick later via bake-off on all 20 scenarios.

## Scaling (decided)
The architecture removes server-side load by design: all inference runs in the user's
browser, so new users bring their own compute. **No backend, no database, no inference
servers.** Therefore **no rate limiting, no proxy, no litellm** — those manage cloud-API
calls we don't make (a dam where there's no river).
- App + lessons + example answers = **static files on a CDN** (free, scales to millions).
- Model weights = loaded from **Hugging Face's CDN** (free), then **browser-cached**
  (downloaded once per user, ever). The big first-load is a UX concern, not a server one.
- Progress/state = in-browser storage (localStorage/IndexedDB), still $0.
- Pitch line: "$0 per user, servers don't notice new users — every learner brings their
  own compute; scales to the planet on a free tier."

## Engagement & progression (decided)
Masterschool = a degree marathon, not a sprint. Engagement is a scored hackathon goal.
Split by whether data is personal or social:
- **Personal → in-browser, $0** (the marathon backbone): **streak** (day-streak, kept — it's
  meaningful on its own), **progression** (lessons done / position in journey), and
  **personalization** (tutor remembers the student's name/where they struggled).
  - **XP/levels: DROPPED.** With unlimited free learning there's nothing to redeem, so
    they were hollow (level just mirrored lessons-done). *Future business feature:* levels
    = **loyalty status → discounts on paid extras** (credential, exam-prep marathons,
    merch). Add when paid products exist — not before.
- **Social (leaderboard, friends) → BONUS only, end of build, only if core is done.**
  Needs a shared store, so it's out of the guaranteed scope. If we get to it:
  leaderboard via a free-tier DB the client writes to directly + a chosen username;
  friends via a "challenge a friend" share link (score in URL, no backend). Decide
  details *then*, not now.
- **The AI never touches a server.** $0-COGS rule (about inference) holds regardless.
- **Priority order:** teaching engine (the heart) → local engagement → [bonus] social.

## Build progress
Arc: **1 scaffold ✓ · 2 brain-swap (on-device wllama) ✓ · 3 offline + browser progress ✓**
· 4 teaching engine (NEXT — the differentiator) · 5 local engagement · 6 polish/deploy.
- **Runtime:** CPU/WASM (`n_gpu_layers: 0`); WebGPU disabled (aborts on Metal/Chrome),
  revisit later as an opt-in speed boost with fallback.
- **Progress:** per-device localStorage (`lib/tutor/progress.ts`). Completion is a TEMP
  "Mark complete" button — the step-4 mastery gate replaces that trigger.
- **Offline:** service worker (`public/sw.js`), registered production-only.
- **Tests:** `npm test` (progress unit test), `npm run test:e2e` (Playwright offline +
  persistence). Step 3 verified ×3 (unit, prod build, 3× e2e).
- **Deferred to deploy (step 6):** static export (`output: 'export'` + bake all courses
  for client-side `?courseId`), and host-level COOP/COEP headers (next.config `headers()`
  is ignored by export).

## Coding conventions
Before writing ANY code, read **`CONVENTIONS.md`** and acknowledge it. General TS rules
apply everywhere; backend-layering rules apply only to the optional bonus server.

## Business model (vision — context, not hackathon scope)
The architecture *enables* the business model: $0 teaching cost → give learning away free.
- **Learning/the whole degree = completely free.** Quality product; tests are hard and
  demanding — only students who truly understand pass.
- **The credential / "stamp" at the end = paid.** Those who go all the way pay for the
  certification (priced below a real university → worth it).
- **Premium extras = paid:** marathons, exam-prep packages, etc.
- Synergy: $0-COGS on-device teaching is *why* free learning is sustainable; revenue comes
  from credentialing + extras, not from per-lesson inference. Tech and business reinforce.

## Working agreement
- **Maintain `docs/DECISIONS.md`** — the living dossier of big decisions, requirements,
  business, problem-solving, differentiation. Update it whenever we make a big call.
- No big decisions made solo (scope, core feature, stack, cuts) — decide together.
- Claude flags doubts out loud, including on Lior's ideas, and flags its own big moves
  before making them.
- Build lean: smallest thing that creates the intended "wow"; name what we skip.
- Win = one unforgettable 3-min demo moment on a sound architecture, finished on time.

## Open gaps
1. ✅ Scenarios — received (`scope/scenarios.csv`, 20 rows). *(Brief said "10"; CSV has
   20 = 10 Biz + 10 SWE. Treat all 20 as the eval unless told otherwise.)*
2. ✅ Demo hardware — M5 Pro, 24 GB unified, 16-core GPU, Metal 4 (high tier).
3. ✅ **Content model** — solved via toy repo (`../maestro-toy`). Course/lesson/outcomes
   JSON schema adopted. Lessons are outcome-based, no prose body (see Reference section).
   *(Still nice-to-have: a couple of real BIZ/SWE lessons to seed our courses.)*
