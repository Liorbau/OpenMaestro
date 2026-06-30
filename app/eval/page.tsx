"use client";

import { useState } from "react";
import { Logo } from "@/components/logo";
import { type EvalMode, type RunResult, runScenario } from "@/lib/eval/run";
import { SCENARIOS } from "@/lib/eval/scenarios";
import { loadModel } from "@/lib/llm/engine";
import { getModelOrThrow, MODELS } from "@/lib/llm/registry";

type Status = "idle" | "loading" | "running" | "bakeoff" | "comparing" | "done";

type Comparison = { baseline: RunResult[]; engine: RunResult[] };

type ModelScore = {
  id: string;
  label: string;
  passed: number;
  total: number;
  avgMs: number;
  status: "pending" | "running" | "done" | "error";
};

export default function EvalPage() {
  const [modelId, setModelId] = useState(MODELS[0]?.id ?? "");
  const [mode, setMode] = useState<EvalMode>("engine");
  const [status, setStatus] = useState<Status>("idle");
  const [loadPct, setLoadPct] = useState<number | null>(null);
  const [results, setResults] = useState<RunResult[]>([]);
  const [board, setBoard] = useState<ModelScore[]>([]);
  const [compare, setCompare] = useState<Comparison | null>(null);
  const [phase, setPhase] = useState("");
  const [error, setError] = useState<string | null>(null);

  const busy = status !== "idle" && status !== "done";
  const onProgress = (loaded: number, total: number): void =>
    setLoadPct(total ? Math.round((loaded / total) * 100) : null);

  const run = async (m: EvalMode): Promise<void> => {
    setMode(m);
    setResults([]);
    setError(null);
    setStatus("loading");
    setLoadPct(null);
    try {
      await loadModel(getModelOrThrow(modelId), (p) => onProgress(p.loaded, p.total), {
        deterministic: true,
      });
    } catch (e) {
      setError(`Couldn't load model: ${(e as Error).message}`);
      setStatus("idle");
      return;
    }
    setStatus("running");
    const acc: RunResult[] = [];
    for (const s of SCENARIOS) {
      try {
        acc.push(await runScenario(s, m));
      } catch (e) {
        acc.push({
          scenario: s,
          response: `⚠️ ${(e as Error).message}`,
          result: { pass: false, requirement: "run error" },
        });
      }
      setResults([...acc]);
    }
    setStatus("done");
  };

  const runAll = async (
    m: EvalMode,
    onEach: (n: number) => void,
  ): Promise<RunResult[]> => {
    const acc: RunResult[] = [];
    for (const s of SCENARIOS) {
      try {
        acc.push(await runScenario(s, m));
      } catch (e) {
        acc.push({
          scenario: s,
          response: `⚠️ ${(e as Error).message}`,
          result: { pass: false, requirement: "run error" },
        });
      }
      onEach(acc.length);
    }
    return acc;
  };

  // The proof: run the SAME model with and without the engine, so the lift is legible.
  const runComparison = async (): Promise<void> => {
    setResults([]);
    setBoard([]);
    setCompare(null);
    setError(null);
    setStatus("loading");
    setLoadPct(null);
    try {
      await loadModel(getModelOrThrow(modelId), (p) => onProgress(p.loaded, p.total), {
        deterministic: true,
      });
    } catch (e) {
      setError(`Couldn't load model: ${(e as Error).message}`);
      setStatus("idle");
      return;
    }
    setStatus("comparing");
    const baseline = await runAll("baseline", (n) =>
      setPhase(`Baseline (no engine) ${n}/${SCENARIOS.length}`),
    );
    const engine = await runAll("engine", (n) =>
      setPhase(`With engine ${n}/${SCENARIOS.length}`),
    );
    setCompare({ baseline, engine });
    setPhase("");
    setStatus("done");
  };

  const runBakeoff = async (): Promise<void> => {
    setResults([]);
    setError(null);
    setStatus("bakeoff");
    const rows: ModelScore[] = MODELS.map((m) => ({
      id: m.id,
      label: m.label,
      passed: 0,
      total: 0,
      avgMs: 0,
      status: "pending",
    }));
    setBoard([...rows]);
    for (let i = 0; i < MODELS.length; i++) {
      const m = MODELS[i];
      rows[i] = { ...rows[i], status: "running" };
      setBoard([...rows]);
      try {
        setPhase(`Loading ${m.label}…`);
        setLoadPct(null);
        await loadModel(m, (p) => onProgress(p.loaded, p.total), {
          deterministic: true,
        });
        let passed = 0;
        let totalMs = 0;
        for (let j = 0; j < SCENARIOS.length; j++) {
          setPhase(`${m.label}: scenario ${j + 1}/${SCENARIOS.length}`);
          const t0 = performance.now();
          const r = await runScenario(SCENARIOS[j], "engine");
          totalMs += performance.now() - t0;
          if (r.result.pass) {
            passed += 1;
          }
        }
        rows[i] = {
          ...rows[i],
          passed,
          total: SCENARIOS.length,
          avgMs: Math.round(totalMs / SCENARIOS.length),
          status: "done",
        };
      } catch {
        rows[i] = { ...rows[i], status: "error" };
      }
      setBoard([...rows]);
    }
    setPhase("");
    setStatus("done");
  };

  const passed = results.filter((r) => r.result.pass).length;
  const ranked = [...board]
    .filter((b) => b.status === "done")
    .sort((a, b) => b.passed - a.passed || a.avgMs - b.avgMs);
  const cmp = compare
    ? {
        base: compare.baseline.filter((r) => r.result.pass).length,
        eng: compare.engine.filter((r) => r.result.pass).length,
        engPass: new Map(compare.engine.map((r) => [r.scenario.id, r.result.pass])),
      }
    : null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center gap-3">
        <Logo className="size-9" />
        <h1 className="text-2xl font-semibold tracking-tight">
          <span className="font-serif lowercase">maestro</span> — eval
        </h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Runs the 20 TutorBench scenarios on-device and scores each against its rubric, with
        greedy, single-threaded decoding. Run one model, "Prove the engine" for baseline vs
        engine, or bake off all candidates.
      </p>

      {/* Single model */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <select
          value={modelId}
          onChange={(e) => setModelId(e.target.value)}
          disabled={busy}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          {MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label} ({m.tier})
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void run("baseline")}
          disabled={busy}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          Run baseline
        </button>
        <button
          type="button"
          onClick={() => void run("engine")}
          disabled={busy}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90 disabled:opacity-50"
        >
          Run engine
        </button>
        <button
          type="button"
          onClick={() => void runComparison()}
          disabled={busy}
          title="Runs the same model with and without the engine — shows the lift per scenario."
          className="rounded-lg bg-success px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          Prove the engine
        </button>
        <span className="mx-1 text-border">|</span>
        <button
          type="button"
          onClick={() => void runBakeoff()}
          disabled={busy}
          title="Downloads every candidate model (several GB) and runs all 20 on each — takes a while."
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50"
        >
          Bake off all models
        </button>
      </div>

      <div className="mt-4 text-sm">
        {status === "loading" && (
          <span className="text-muted-foreground">
            Loading model… {loadPct !== null ? `${loadPct}%` : ""}
          </span>
        )}
        {(status === "bakeoff" || status === "comparing") && (
          <span className="text-muted-foreground">
            {phase} {loadPct !== null ? `(${loadPct}%)` : ""}
          </span>
        )}
        {(status === "running" || (status === "done" && results.length > 0)) && (
          <span>
            <span className="font-semibold">
              {passed}/{results.length}
            </span>{" "}
            passed · <span className="text-muted-foreground">{mode}</span>
          </span>
        )}
        {error && <span className="text-destructive">{error}</span>}
      </div>

      {/* Proof: same model, with vs without the engine */}
      {cmp && (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Same model · on-device · $0
            </p>
            <p className="mt-2 text-lg leading-relaxed">
              The engine lifts{" "}
              <span className="font-semibold">{getModelOrThrow(modelId).label}</span> from{" "}
              <span className="font-semibold">
                {cmp.base}/{SCENARIOS.length}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-success">
                {cmp.eng}/{SCENARIOS.length}
              </span>{" "}
              <span
                className={
                  cmp.eng - cmp.base >= 0
                    ? "font-semibold text-success"
                    : "font-semibold text-destructive"
                }
              >
                ({cmp.eng - cmp.base >= 0 ? "+" : ""}
                {cmp.eng - cmp.base})
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Greedy, single-thread → reproducible. Same brain both runs; only the teaching
              layer differs.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Scenario</th>
                  <th className="px-4 py-2">Baseline</th>
                  <th className="px-4 py-2">Engine</th>
                </tr>
              </thead>
              <tbody>
                {compare?.baseline.map((r) => {
                  const engPass = cmp.engPass.get(r.scenario.id) ?? false;
                  const fixed = !r.result.pass && engPass;
                  return (
                    <tr
                      key={r.scenario.id}
                      className={`border-t border-border ${fixed ? "bg-success/5" : ""}`}
                    >
                      <td className="px-4 py-2">
                        <span className="font-medium">{r.scenario.id}</span>{" "}
                        <span className="text-muted-foreground">{r.scenario.subIssue}</span>
                      </td>
                      <td className="px-4 py-2">
                        <Dot pass={r.result.pass} />
                      </td>
                      <td className="px-4 py-2">
                        <Dot pass={engPass} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {board.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">Model</th>
                <th className="px-4 py-2">Passed</th>
                <th className="px-4 py-2">Avg time</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((row, i) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-4 py-2 font-mono">{i + 1}</td>
                  <td className="px-4 py-2 font-medium">{row.label}</td>
                  <td className="px-4 py-2">
                    {row.passed}/{row.total}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {(row.avgMs / 1000).toFixed(1)}s
                  </td>
                </tr>
              ))}
              {board
                .filter((b) => b.status !== "done")
                .map((row) => (
                  <tr key={row.id} className="border-t border-border text-muted-foreground">
                    <td className="px-4 py-2">–</td>
                    <td className="px-4 py-2">{row.label}</td>
                    <td className="px-4 py-2" colSpan={2}>
                      {row.status === "running"
                        ? "running…"
                        : row.status === "error"
                          ? "error"
                          : "pending"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Single-run detail */}
      <ol className="mt-6 space-y-3">
        {results.map((r) => (
          <li key={r.scenario.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-medium">
                {r.scenario.id} · {r.scenario.subIssue}
              </div>
              <span
                className={
                  r.result.pass
                    ? "rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success"
                    : "rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive"
                }
              >
                {r.result.pass ? "PASS" : "FAIL"}
              </span>
            </div>
            <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
              needs: {r.result.requirement}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{r.response}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Dot({ pass }: { pass: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${pass ? "text-success" : "text-destructive"}`}
    >
      <span
        className={`size-2 rounded-full ${pass ? "bg-success" : "bg-destructive"}`}
      />
      {pass ? "pass" : "fail"}
    </span>
  );
}
