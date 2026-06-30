// The verifier: cheap, deterministic checks on the model's OWN output — catching its
// worst mistakes with $0 code instead of a bigger model. A small model usually knows the
// method but slips on the arithmetic, so we recompute any "<expression> = <result>" claim
// and fix a wrong result. Runs on the final reply (product + eval), never mid-stream.
// See CLAUDE.md "Central bet" (behaviour/verification over IQ) + "Quality stack" (tools).

// --- Safe arithmetic evaluator (no eval): recursive descent over a numeric expression.
// Supports + - * / // % and unicode − × ÷ and parentheses. Returns null when the string
// isn't a clean numeric expression, so we never "correct" something we didn't fully parse.

const OPS = new Set(["+", "-", "*", "/", "//", "%"]);
const NUM_RE = /^\d*\.?\d+$/;

function tokenize(src: string): string[] | null {
  const s = src
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/[−–—]/g, "-");
  const tokens: string[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === " " || c === "\t") {
      i++;
      continue;
    }
    if ((c >= "0" && c <= "9") || c === ".") {
      let j = i + 1;
      while (j < s.length && /[0-9.]/.test(s[j])) {
        j++;
      }
      const num = s.slice(i, j);
      if (!NUM_RE.test(num)) {
        return null;
      }
      tokens.push(num);
      i = j;
      continue;
    }
    if (c === "/" && s[i + 1] === "/") {
      tokens.push("//");
      i += 2;
      continue;
    }
    if ("+-*/%()".includes(c)) {
      tokens.push(c);
      i++;
      continue;
    }
    return null; // a letter, comma, etc. → not a clean numeric expression
  }
  return tokens;
}

function evaluate(tokens: string[]): number | null {
  let pos = 0;
  const peek = (): string | undefined => tokens[pos];

  function parseFactor(): number | null {
    const tk = peek();
    if (tk === "-") {
      pos++;
      const f = parseFactor();
      return f === null ? null : -f;
    }
    if (tk === "(") {
      pos++;
      const e = parseExpr();
      if (e === null || tokens[pos++] !== ")") {
        return null;
      }
      return e;
    }
    if (tk !== undefined && NUM_RE.test(tk)) {
      pos++;
      return parseFloat(tk);
    }
    return null;
  }

  function parseTerm(): number | null {
    let left = parseFactor();
    if (left === null) {
      return null;
    }
    while (peek() === "*" || peek() === "/" || peek() === "//" || peek() === "%") {
      const op = tokens[pos++];
      const right = parseFactor();
      if (right === null) {
        return null;
      }
      if ((op === "/" || op === "//" || op === "%") && right === 0) {
        return null; // division by zero → refuse to "verify"
      }
      if (op === "*") {
        left *= right;
      } else if (op === "/") {
        left /= right;
      } else if (op === "//") {
        left = Math.floor(left / right);
      } else {
        left %= right;
      }
    }
    return left;
  }

  function parseExpr(): number | null {
    let left = parseTerm();
    if (left === null) {
      return null;
    }
    while (peek() === "+" || peek() === "-") {
      const op = tokens[pos++];
      const right = parseTerm();
      if (right === null) {
        return null;
      }
      left = op === "+" ? left + right : left - right;
    }
    return left;
  }

  const result = parseExpr();
  if (result === null || pos !== tokens.length) {
    return null; // trailing junk → reject rather than half-evaluate
  }
  return result;
}

// Evaluate a numeric expression string, or null if it isn't one (or has no operator, so
// there's nothing to check).
export function evalArith(src: string): number | null {
  const tokens = tokenize(src);
  if (!tokens || !tokens.some((t) => OPS.has(t))) {
    return null;
  }
  return evaluate(tokens);
}

// --- Arithmetic correction -----------------------------------------------------------

const APPROX_RE = /[~≈]|\b(about|around|roughly|approx|approximately|nearly|almost)\b/i;
// "<expr> <connector> <number>[%]" — expr starts with a digit or "(" and is only
// numeric/operator characters (variables, words, commas break it). The connector is "="
// or a natural-language equality ("is" / "equals" / "gives"), so prose like "17 % 5 is 2"
// is checked too, not only equations.
const CLAIM_RE =
  /([0-9(][-+*/%()0-9.\s×÷−–—]*)\s*(?:=|:|→|\bis\b|\bequals\b|\bgives\b)\s*(-?\d+(?:\.\d+)?)(\s*%)?/gi;

function formatNum(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 10000) / 10000);
}

// Recompute every arithmetic claim; replace a stated result that's wrong. Conservative:
// skips hedged claims ("≈ 20%") and anything it can't fully parse, so it never introduces
// an error — worst case it does nothing.
export function correctArithmetic(text: string): string {
  const edits: Array<{ from: string; to: string }> = [];
  let m: RegExpExecArray | null;
  CLAIM_RE.lastIndex = 0;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex exec loop
  while ((m = CLAIM_RE.exec(text)) !== null) {
    const around = text.slice(Math.max(0, m.index - 16), m.index + m[0].length + 4);
    if (APPROX_RE.test(around)) {
      continue;
    }
    const value = evalArith(m[1]);
    if (value === null || !Number.isFinite(value)) {
      continue;
    }
    const stated = parseFloat(m[2]);
    const isPct = Boolean(m[3]);
    let correct: number | null = null;
    if (isPct) {
      // Accept the value written either as a fraction (v→v*100%) or already as a percent.
      const ok =
        Math.abs(stated - value * 100) < 1e-3 || Math.abs(stated - value) < 1e-3;
      if (!ok) {
        correct = Math.abs(value) <= 1 ? value * 100 : value;
      }
    } else if (Math.abs(stated - value) >= 1e-6) {
      correct = value;
    }
    if (correct === null) {
      continue;
    }
    const rest = m[0].slice(m[1].length).replace(m[2], formatNum(correct));
    edits.push({ from: m[0], to: m[1] + rest });
  }
  let out = text;
  for (const e of edits) {
    out = out.replace(e.from, e.to);
  }
  return out;
}

// If a reply was cut mid-sentence (hit the token cap), drop the trailing partial sentence
// so we never store or feed back a fragment — otherwise the model "continues" it on the
// next turn (e.g. "...int(1" → next reply starts "0)?"). Leaves clean endings untouched.
export function trimDangling(text: string): string {
  const t = text.trimEnd();
  if (!t) {
    return text;
  }
  const last = t[t.length - 1];
  // Ends cleanly: sentence punctuation, a closing quote/bracket, or a code fence.
  if (/[.!?…:)\]}"'`]/.test(last) || t.endsWith("```")) {
    return text;
  }
  // Cut mid-sentence → trim back to the last sentence terminator, if there is one.
  const idx = Math.max(
    t.lastIndexOf("."),
    t.lastIndexOf("!"),
    t.lastIndexOf("?"),
    t.lastIndexOf("…"),
  );
  return idx > 0 ? t.slice(0, idx + 1) : text;
}

const CHALLENGE_NUDGE =
  "No spoilers in challenge mode — here's a nudge instead: reason it through from what you already know, and tell me which term fits.";

// Challenge/quiz backstop: if the reply reveals a withheld answer, replace it with a safe
// nudge. The prompt + skill already discourage leaking; this makes it impossible.
export function redactLeak(text: string, forbidden: string[]): string {
  const t = text.toLowerCase();
  const leaked = forbidden.some((w) => t.includes(w.toLowerCase()));
  return leaked ? CHALLENGE_NUDGE : text;
}

// The single entry point the product + eval call on a finished reply. Arithmetic today;
// more guards slot in here.
export function verifyReply(text: string): string {
  return correctArithmetic(text);
}
