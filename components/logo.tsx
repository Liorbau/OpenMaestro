import { cn } from "@/lib/utils";

// The Maestro brand mark (shield). Dark colorway for light surfaces; `light` uses the
// cream colorway for dark surfaces (e.g. the landing hero).
export function Logo({ className, light }: { className?: string; light?: boolean }) {
  // biome-ignore lint/performance/noImgElement: tiny static SVG, next/image adds no value
  return (
    <img
      src={light ? "/maestro-light.svg" : "/maestro.svg"}
      alt="Maestro"
      className={cn("size-8", className)}
    />
  );
}

// Mark + serif wordmark, for headers.
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <Logo className="size-7" />
      <span className="font-serif text-lg lowercase tracking-tight">maestro</span>
    </span>
  );
}
