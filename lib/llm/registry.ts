// The model registry: swapping a model is swapping an id. Auto tier-selection for
// students (invisible); dev override via ?model=<id>. See CLAUDE.md "Model registry".

export type Tier = "low" | "mid" | "high";

export type ModelEntry = {
  id: string;
  label: string;
  // Single GGUF URL, or an array of shard URLs (wllama stitches them). Files >2GB
  // MUST be sharded (<512MB) — single >2GB hits the browser ArrayBuffer limit.
  url: string | string[];
  tier: Tier;
  nCtx: number;
};

export const MODELS: ModelEntry[] = [
  {
    id: "qwen2.5-0.5b",
    label: "Qwen2.5 0.5B Instruct",
    url: "https://huggingface.co/bartowski/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/Qwen2.5-0.5B-Instruct-Q4_K_M.gguf",
    tier: "low",
    nCtx: 4096,
  },
  {
    id: "llama3.2-1b",
    label: "Llama 3.2 1B Instruct",
    url: "https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf",
    tier: "low",
    nCtx: 4096,
  },
  {
    id: "qwen2.5-1.5b",
    label: "Qwen2.5 1.5B Instruct",
    url: "https://huggingface.co/bartowski/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/Qwen2.5-1.5B-Instruct-Q4_K_M.gguf",
    tier: "low",
    nCtx: 4096,
  },
  {
    id: "smollm2-1.7b",
    label: "SmolLM2 1.7B Instruct",
    url: "https://huggingface.co/bartowski/SmolLM2-1.7B-Instruct-GGUF/resolve/main/SmolLM2-1.7B-Instruct-Q4_K_M.gguf",
    tier: "low",
    nCtx: 4096,
  },
  {
    id: "gemma2-2b",
    label: "Gemma 2 2B Instruct",
    url: "https://huggingface.co/bartowski/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf",
    tier: "mid",
    nCtx: 4096,
  },
  {
    id: "qwen2.5-3b",
    label: "Qwen2.5 3B Instruct",
    url: "https://huggingface.co/bartowski/Qwen2.5-3B-Instruct-GGUF/resolve/main/Qwen2.5-3B-Instruct-Q4_K_M.gguf",
    tier: "mid",
    nCtx: 4096,
  },
  {
    id: "llama3.2-3b",
    label: "Llama 3.2 3B Instruct",
    url: "https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf",
    tier: "mid",
    nCtx: 4096,
  },
];

export const DEFAULT_MODEL_ID = "qwen2.5-3b";
// The small model booted instantly while a bigger one downloads (instant-start).
export const INSTANT_MODEL_ID = "llama3.2-1b";

export function getModel(id: string): ModelEntry | undefined {
  return MODELS.find((m) => m.id === id);
}

// Fail visibly rather than silently substituting (CONVENTIONS.md #14).
export function getModelOrThrow(id: string): ModelEntry {
  const model = getModel(id);
  if (!model) {
    throw new Error(`Unknown model id: "${id}". Known: ${MODELS.map((m) => m.id).join(", ")}`);
  }
  return model;
}

type NavigatorWithMemory = Navigator & { deviceMemory?: number };

// Pick the model for this device. Dev override (?model=<id>) wins; else auto by capability.
export function selectModel(): ModelEntry {
  if (typeof window === "undefined") {
    return getModelOrThrow(DEFAULT_MODEL_ID);
  }
  const override = new URLSearchParams(window.location.search).get("model");
  if (override) {
    return getModelOrThrow(override);
  }
  const mem = (navigator as NavigatorWithMemory).deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 4;
  if (mem <= 4 || cores <= 4) {
    return getModelOrThrow("qwen2.5-1.5b");
  }
  return getModelOrThrow(DEFAULT_MODEL_ID);
}

// The model to boot instantly while `full` downloads. Returns `full` unchanged when a
// two-tier boot isn't worth it: only the 3B tier is big enough to be worth covering with a
// quick 1B first, and a dev-pinned ?model= should load exactly what was asked.
export function instantModelFor(full: ModelEntry): ModelEntry {
  if (
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("model")
  ) {
    return full;
  }
  const instant = getModelOrThrow(INSTANT_MODEL_ID);
  const worthIt = full.id.endsWith("-3b") && full.id !== instant.id;
  return worthIt ? instant : full;
}
