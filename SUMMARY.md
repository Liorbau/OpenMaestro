# OpenMaestro — one-page summary

**The idea:** an open version of Maestro, an AI tutor that runs **entirely in the browser**
at **$0 per user** — teaching well by *engineering discipline into a small model*, not by
paying for a big one. Live: https://openmaestro.vercel.app

**Business model:** learning is **free** (teaching costs $0 — the model runs on the learner's
device); revenue comes from the **paid credential** (the "stamp") and **premium exam-prep /
marathons**. Tech and business reinforce each other: free-to-run is *why* free-to-learn scales.

**Features:** on-device tutor · works **offline** · **mastery-gated** progression (objective
quiz, no self-marking) · remembers your name + progress · streak · onboarding + control
center · 3 courses (Python, Business, Frontend) · cinematic landing.

**Technology:** on-device inference via **wllama (llama.cpp/WASM)** — no server, no per-user
cost; app + lessons are **static files on a free CDN**, weights browser-cached once.
**Why wllama over web-llm:** wllama runs on the **CPU (WASM)** so it works on *any* device;
web-llm needs **WebGPU**, which is missing or flaky on much of the world's hardware — wllama is
what makes "everyone, everywhere" real. The differentiator is a **behavioral teaching engine**
(prompt discipline + per-turn skills + a $0 deterministic verifier + mastery gate) that lifts a
small model on the exact scenarios Maestro slips on, measured by a reproducible in-browser
eval. Every new user brings their own compute → scales to the planet on a free tier.
