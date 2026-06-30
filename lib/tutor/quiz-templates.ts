// Parameterized quiz templates: code generates fresh variables AND computes the correct
// answer each run, so computational questions vary every attempt with zero risk of a
// wrong answer key. Authored content references these by id. See CLAUDE.md "Quality stack".
import type { GeneratedQuestion, QuizTemplate } from "./quiz";

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const QUIZ_TEMPLATES: Record<string, QuizTemplate> = {
  // PY101-01, outcome "convert between types": int("a") + b
  "py101-int-add": (): GeneratedQuestion => {
    const a = randInt(2, 9);
    const b = randInt(2, 9);
    const answer = a + b;
    return {
      question: `What does int("${a}") + ${b} evaluate to?`,
      options: [`${answer}`, `"${a}${b}"`, `${answer + 1}`, "A TypeError"],
      correctIndex: 0,
    };
  },

  // PY101-03, outcome "iterate with range()": how many times range(n) runs
  "py101-range-count": (): GeneratedQuestion => {
    const n = randInt(2, 6);
    return {
      question: `How many times does the body of \`for i in range(${n}):\` run?`,
      options: [`${n}`, `${n - 1}`, `${n + 1}`, "Infinitely"],
      correctIndex: 0,
    };
  },

  // BIZ102-02, outcome "compute gross margin": margin = (price - cost) / price
  "biz-gross-margin": (): GeneratedQuestion => {
    const cost = randInt(20, 80);
    const price = cost + randInt(10, 60);
    const margin = Math.round(((price - cost) / price) * 100);
    const markup = Math.round(((price - cost) / cost) * 100); // the classic trap
    const costPct = Math.round((cost / price) * 100);
    const fourth = costPct === margin ? margin + 12 : costPct;
    return {
      question: `A product costs $${cost} to make and sells for $${price}. What is the gross margin?`,
      options: [`${margin}%`, `${markup}%`, `$${price - cost}`, `${fourth}%`],
      correctIndex: 0,
    };
  },

  // PY101-02, outcome "comparison and logical operators": a boolean expression
  "py101-bool-and": (): GeneratedQuestion => {
    const a = randInt(1, 9);
    const b = randInt(1, 9);
    const c = randInt(1, 9);
    const d = randInt(1, 9);
    const answer = a > b && c === d;
    return {
      question: `What does (${a} > ${b}) and (${c} == ${d}) evaluate to?`,
      options: ["True", "False", "An error", "1"],
      correctIndex: answer ? 0 : 1,
    };
  },
};
