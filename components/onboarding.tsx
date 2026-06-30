"use client";

import { Briefcase, Code2 } from "lucide-react";
import { type CSSProperties, type ReactNode, useMemo, useState } from "react";
import { Globe } from "@/components/globe";
import { Logo } from "@/components/logo";
import type { Track } from "@/lib/syllabus";

// First-run hero, ported from maestro-landing.html: dark starfield stage with a rotating
// Earth, the cream Maestro mark + Newsreader wordmark, then name → degree. Choosing a
// degree saves the profile and enters the (light) app with only that degree's courses.
export function Onboarding({
  onComplete,
}: {
  onComplete: (name: string, track: Track) => void;
}) {
  const [name, setName] = useState("");
  const [phase, setPhase] = useState<"name" | "degree">("name");

  const toDegree = (): void => {
    if (name.trim()) {
      setPhase("degree");
    }
  };

  return (
    <div className="maestro-stage flex flex-col items-center font-body text-white">
      <Stars />
      <div className="maestro-glow z-[2]" />
      <Globe />

      <div className="relative z-[5] flex min-h-svh flex-col items-center px-6 pt-[15vh] text-center">
        <div className="maestro-flow" style={{ animationDelay: ".1s" }}>
          <Logo light className="h-[58px] w-[52px]" />
        </div>
        <div
          className="maestro-flow mt-[22px] font-serif text-[clamp(56px,9vw,104px)] font-normal lowercase leading-none tracking-[-0.01em] text-[#F5F4EF]"
          style={{ animationDelay: ".3s" }}
        >
          maestro
        </div>

        {phase === "name" ? (
          <>
            <p
              className="maestro-flow mt-7 max-w-[520px] text-[19px] leading-normal text-[#F5F4EF]/70"
              style={{ animationDelay: ".55s" }}
            >
              One-on-one tutor.
            </p>
            <p
              className="maestro-flow mt-0.5 text-[19px] text-[#F5F4EF]/70"
              style={{ animationDelay: ".7s" }}
            >
              AI higher education for ALL
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                toDegree();
              }}
              className="maestro-flow mt-10 flex flex-wrap items-stretch justify-center gap-3"
              style={{ animationDelay: ".92s" }}
            >
              {/* biome-ignore lint/a11y/noAutofocus: first field of the first screen */}
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                aria-label="Your name"
                autoComplete="off"
                className="h-14 w-[min(340px,72vw)] rounded-full border border-white/[0.16] bg-white/5 px-[22px] text-[17px] text-[#F5F4EF] outline-none transition placeholder:text-[#F5F4EF]/45 focus:border-[#A6B2F7]/90 focus:ring-4 focus:ring-[#A6B2F7]/20"
              />
              <button
                type="submit"
                className="h-14 rounded-full bg-[#A6B2F7] px-[34px] text-[16px] font-semibold text-[#2F3B9E] transition hover:bg-[#BAC4F9] active:scale-[0.97]"
              >
                Continue
              </button>
            </form>
          </>
        ) : (
          <>
            <p
              className="maestro-flow mt-7 max-w-[560px] text-[19px] leading-relaxed text-[#F5F4EF]/80"
              style={{ animationDelay: ".05s" }}
            >
              Wherever you are, {name} — what would you like to study?
            </p>
            <div
              className="maestro-flow mt-10 flex flex-wrap items-stretch justify-center gap-4"
              style={{ animationDelay: ".25s" }}
            >
              <DegreeCard
                label="Business"
                sub="Markets, unit economics, growth"
                icon={<Briefcase className="size-7" />}
                onPick={() => onComplete(name.trim(), "Biz")}
              />
              <DegreeCard
                label="Software Engineering"
                sub="Python, TypeScript, React"
                icon={<Code2 className="size-7" />}
                onPick={() => onComplete(name.trim(), "SWE")}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Deterministic sparse starfield (same seed as the source design → stable, SSR-safe).
function Stars() {
  const stars = useMemo(() => {
    let seed = 20250701;
    const rnd = (): number => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    return Array.from({ length: 46 }, () => {
      const op = +(0.14 + rnd() * 0.46).toFixed(2);
      const px = rnd() < 0.2 ? 2 : 1;
      const left = (rnd() * 100).toFixed(2);
      const top = (rnd() * 56).toFixed(2);
      const dur = (3.5 + rnd() * 4).toFixed(1);
      const delay = (rnd() * 4).toFixed(1);
      return { op, px, left, top, dur, delay };
    });
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden>
      {stars.map((s, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: static, never reordered
          key={i}
          className="maestro-star"
          style={
            {
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.px,
              height: s.px,
              opacity: s.op,
              "--s-base": s.op,
              animation: `maestro-twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

function DegreeCard({
  label,
  sub,
  icon,
  onPick,
}: {
  label: string;
  sub: string;
  icon: ReactNode;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="group flex w-[240px] flex-col items-start gap-2 rounded-2xl border border-white/[0.14] bg-white/5 p-5 text-left backdrop-blur transition hover:border-[#A6B2F7]/70 hover:bg-white/[0.09]"
    >
      <span className="flex size-11 items-center justify-center rounded-xl bg-[#A6B2F7]/15 text-[#A6B2F7] ring-1 ring-[#A6B2F7]/25 transition-transform duration-300 group-hover:scale-105">
        {icon}
      </span>
      <span className="mt-1 text-lg font-semibold text-[#F5F4EF]">{label}</span>
      <span className="text-sm leading-relaxed text-[#F5F4EF]/55">{sub}</span>
    </button>
  );
}
