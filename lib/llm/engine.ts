// The on-device brain. A thin wllama adapter: load a model once, stream chat completions.
// Runs entirely in the browser — no server, $0 COGS. See CLAUDE.md "Runtime".
// Import the compiled ESM build directly — the package "main" is raw .ts that
// Turbopack can't consume. esm/index.d.ts provides the types.
import { CacheManager, Wllama } from "@wllama/wllama/esm/index.js";
import type { ModelEntry } from "./registry";

// wasm is self-hosted in /public/wllama (not a CDN) for reliability + offline.
const WASM_PATHS = {
  "wllama.wasm": "/wllama/wllama.wasm",
  default: "/wllama/wllama.wasm",
};

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LoadProgress = { loaded: number; total: number };

let instance: Wllama | null = null;
let loadedModelId: string | null = null;
let loadedDeterministic = false;
let loadPromise: Promise<void> | null = null;
// The latest caller's progress handler. A prefetch may start the download with no handler;
// when the lesson view later awaits the same in-flight load, its bar still updates.
let activeOnProgress: ((p: LoadProgress) => void) | undefined;

export function isModelLoaded(id: string): boolean {
  return instance !== null && loadedModelId === id;
}

// Wipe wllama's on-device model store (OPFS). Use to recover from a corrupted /
// half-written cache (download interrupted, crash between bytes and metadata),
// which surfaces as a misleading "Model file not found".
export async function resetCache(): Promise<void> {
  await new CacheManager().clear();
  instance = null;
  loadedModelId = null;
  loadedDeterministic = false;
  loadPromise = null;
}

// Idempotent: returns the in-flight load if one is running, no-ops if already loaded.
// `deterministic` loads single-threaded with no cache reuse — multi-threaded float
// reduction isn't reproducible even at temp 0, so the eval uses this for stable scores.
export async function loadModel(
  model: ModelEntry,
  onProgress?: (p: LoadProgress) => void,
  opts: { deterministic?: boolean } = {},
): Promise<void> {
  const deterministic = opts.deterministic ?? false;
  activeOnProgress = onProgress; // latest caller wins, even for an in-flight prefetch
  if (isModelLoaded(model.id) && loadedDeterministic === deterministic) {
    return;
  }
  if (loadPromise) {
    return loadPromise;
  }
  loadPromise = (async () => {
    // Ask the browser to keep our cached model (avoids eviction → re-downloads).
    if (typeof navigator !== "undefined" && navigator.storage?.persist) {
      try {
        await navigator.storage.persist();
      } catch {
        // Best-effort; not fatal if denied.
      }
    }
    // Free the previous context when switching model OR thread mode (multi ↔ single).
    if (instance && (loadedModelId !== model.id || loadedDeterministic !== deterministic)) {
      try {
        await instance.exit();
      } catch {
        // Best-effort.
      }
      instance = null;
      loadedModelId = null;
    }
    const wllama = new Wllama(WASM_PATHS);
    // For sharded models, wllama auto-loads sibling chunks from the first shard URL.
    const source = Array.isArray(model.url) ? model.url[0] : model.url;
    await wllama.loadModelFromUrl(source, {
      n_ctx: model.nCtx,
      // Product: reuse the KV cache for the shared prompt prefix across turns → each turn
      // only prefills NEW tokens (the real TTFT win). Eval: 0 so scenarios are independent.
      n_cache_reuse: deterministic ? 0 : 256,
      // CPU/WASM only. wllama defaults n_gpu_layers to 99999 (offload all to WebGPU),
      // but WebGPU support is flaky across devices and aborts here on Metal/Chrome.
      // llama.cpp's WASM path is our reliable "everyone everywhere" spine and is already
      // fast enough (~28 tok/s for 3B on M5). WebGPU can return later as an opt-in boost.
      n_gpu_layers: 0,
      // Single-thread for the eval: fixes float-reduction order → greedy is reproducible.
      ...(deterministic ? { n_threads: 1 } : {}),
      progressCallback: (p: LoadProgress) => activeOnProgress?.(p),
    });
    instance = wllama;
    loadedModelId = model.id;
    loadedDeterministic = deterministic;
  })();
  try {
    await loadPromise;
  } finally {
    loadPromise = null;
  }
}

// Is this model's weights already in the on-device (OPFS) cache? Used to decide whether
// the two-tier boot can skip the tiny model (returning users) or swap up (download done).
export async function isCached(model: ModelEntry): Promise<boolean> {
  try {
    const cm = new CacheManager();
    const urls = Array.isArray(model.url) ? model.url : [model.url];
    for (const u of urls) {
      const name = await cm.getNameFromURL(u);
      if (!(await cm.getMetadata(name))) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

// Stream a model's weights to the cache WITHOUT instantiating it (no RAM, disk only) — so
// a tiny model can keep teaching while the full one downloads in the background. A later
// loadModel() then loads it from cache in ~seconds. Skips shards already cached.
export async function downloadToCache(
  model: ModelEntry,
  onProgress?: (p: LoadProgress) => void,
): Promise<void> {
  const cm = new CacheManager();
  const urls = Array.isArray(model.url) ? model.url : [model.url];
  for (const u of urls) {
    const name = await cm.getNameFromURL(u);
    if (await cm.getMetadata(name)) {
      continue; // already cached
    }
    await cm.download(u, { progressCallback: (p) => onProgress?.(p) });
  }
}

export type ChatOptions = {
  onToken?: (fullText: string) => void;
  maxTokens?: number;
  abortSignal?: AbortSignal;
  // Override sampling temperature. 0 = greedy (used by the eval); the product leaves it
  // at the default for natural variety. Reproducibility also needs a single-thread load.
  temperature?: number;
  // Fixed RNG seed — the eval sets it so any residual sampling is pinned too.
  seed?: number;
  // Prompt-cache reuse for this call. The eval sets false so each scenario is fully
  // independent (no KV carry-over from the previous scenario's cut-off generation).
  cachePrompt?: boolean;
};

// One wllama context can't run two completions at once, so serialize: each call waits
// for the previous to settle. Prevents collisions when e.g. switching lessons mid-reply.
let chatQueue: Promise<unknown> = Promise.resolve();

// Streams a chat completion, calling onToken with the cumulative text per chunk.
// Returns the full final text.
export function chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<string> {
  const run = chatQueue.then(() => runChat(messages, opts));
  chatQueue = run.catch(() => undefined);
  return run;
}

async function runChat(messages: ChatMessage[], opts: ChatOptions): Promise<string> {
  if (!instance) {
    throw new Error("Model not loaded — call loadModel() before chat().");
  }
  const stream = await instance.createChatCompletion({
    messages,
    stream: true,
    max_tokens: opts.maxTokens ?? 512,
    // Lower temperature = steadier, cleaner output (fewer stray tokens/punctuation),
    // which suits tutoring better than creative variety. Eval passes 0 for determinism.
    temperature: opts.temperature ?? 0.4,
    top_p: 0.9,
    top_k: 40,
    ...(opts.seed !== undefined ? { seed: opts.seed } : {}),
    ...(opts.cachePrompt !== undefined ? { cache_prompt: opts.cachePrompt } : {}),
    abortSignal: opts.abortSignal,
  });
  let full = "";
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? "";
    if (delta) {
      full += delta;
      opts.onToken?.(full);
    }
  }
  return full;
}
