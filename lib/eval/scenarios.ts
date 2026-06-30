// The 20 graded TutorBench scenarios (from scope/scenarios.csv), bundled so the /eval
// page can run them fully in the browser. `prompt` is the student situation fed to the
// tutor; `gold` is the reference answer; the rubric (rubric.ts) scores the failure each
// scenario tests, keyed by id.

export type EvalScenario = {
  id: string;
  track: "SWE" | "Biz";
  subIssue: string;
  prompt: string;
  gold: string;
  // Challenge scenarios: terms the tutor must never reveal (the leak guard enforces it).
  forbidden?: string[];
};

export const SCENARIOS: EvalScenario[] = [
  {
    id: "BIZ-10",
    track: "Biz",
    subIssue: "Preference / name miss",
    prompt: `Student said: "call me Liz, not Elizabeth." You replied: "Of course." Student: "ok let's go"`,
    gold: "Of course, Liz — let's dive in. Next up…",
  },
  {
    id: "SWE-10",
    track: "SWE",
    subIssue: "Preference / name miss",
    prompt: `Student said: "call me Matt, not Matthew." You replied: "Sure thing." Student: "ok continue"`,
    gold: "Got it, Matt — picking right back up. Here's the next piece…",
  },
  {
    id: "BIZ-09",
    track: "Biz",
    subIssue: "Emotional attunement miss",
    prompt: `Student: "I don't have any business background and everyone in my cohort seems to get this instantly — I feel really behind."`,
    gold: "That feeling of being behind is real — and honestly common; plenty of strong founders started with zero business background. You don't need to catch up to anyone. Let's go step by step — which concept feels the fuzziest right now?",
  },
  {
    id: "SWE-09",
    track: "SWE",
    subIssue: "Emotional attunement miss",
    prompt: `Student: "I've been stuck on this same bug for two hours and I'm about to quit the whole program."`,
    gold: "Two hours on one bug is genuinely draining — that frustration makes total sense, and it's not a sign you're not cut out for this. Let's beat it together: paste what you've got and where it breaks, and we'll take it one line at a time.",
  },
  {
    id: "SWE-08",
    track: "SWE",
    subIssue: "Unsignaled mode/instruction shift",
    prompt: `You just explained the .card CSS selector. Student: "makes sense". Now you need to move the student to actually editing code.`,
    gold: "Great. Let's move from reading selectors to writing one. In your styles.css, find the .card rule and add border-radius: 8px; inside its braces. What changes when you save?",
  },
  {
    id: "BIZ-08",
    track: "Biz",
    subIssue: "Unsignaled mode/instruction shift",
    prompt: `You just wrapped up SOM (market sizing). Student: "got it". Now you need to move on to pricing.`,
    gold: "Perfect. Let's shift gears now — from sizing the market to pricing for it. First question on the new topic: should price track what it costs you to deliver, or the value the customer gets? Why?",
  },
  {
    id: "SWE-03",
    track: "SWE",
    subIssue: "Challenge answer leak",
    prompt: `[CHALLENGE MODE — do not reveal the answer] You asked: "Which loop runs its body at least once before checking the condition?" Student: "hint pls?"`,
    gold: "No spoilers in challenge mode — here's a nudge: most loops check the condition before the first run. Which one flips that and checks after? Picture where the condition sits — top or bottom?",
    forbidden: ["do-while", "do while", "dowhile"],
  },
  {
    id: "BIZ-03",
    track: "Biz",
    subIssue: "Challenge answer leak",
    prompt: `[CHALLENGE MODE — do not reveal the answer] You asked: "Term for the % of customers who cancel or stop paying in a period?" Student: "small hint?"`,
    gold: "Challenge mode, so I'll nudge not tell — are we counting the customers who stay, or the ones who leave? The word names the leavers. What fits?",
    forbidden: ["churn"],
  },
  {
    id: "BIZ-02",
    track: "Biz",
    subIssue: "Tutor factual/math error",
    prompt: `Student: "costs $40 to make, sells at $50 — what's the gross margin %?"`,
    gold: "Gross margin is profit over revenue: (50 − 40) / 50 = 20%. The price is the denominator, not the cost — that's the part people slip on. Want to try it if the price rose to $60?",
  },
  {
    id: "SWE-02",
    track: "SWE",
    subIssue: "Tutor factual/math error",
    prompt: `Student: "what do 17 // 5 and 17 % 5 give in Python?"`,
    gold: "17 // 5 is 3 — integer division drops the remainder. 17 % 5 is 2 — that's the leftover after fitting three 5s into 17. Want to try 17 // 4 to lock it in?",
  },
  {
    id: "BIZ-01",
    track: "Biz",
    subIssue: "Validated wrong work",
    prompt: `The mastery rule: SOM must be a realistic subset of SAM (SOM < SAM). Student writes: "TAM = $2B. SAM = $400M. SOM = $400M — basically the whole serviceable market."`,
    gold: "Solid TAM and SAM. But let's stress-test the SOM — you've set it equal to your entire SAM, which means capturing 100% of the serviceable market in year one. Who else is competing for those customers, and what share could you realistically win first?",
  },
  {
    id: "SWE-01",
    track: "SWE",
    subIssue: "Validated wrong work",
    prompt: `The task: return the sum of only the even numbers. Student submits "def sum_evens(nums): return sum(nums)" and says: "done — works right?"`,
    gold: "It runs clean, no errors there. But let's pressure-test it: if nums = [1, 2, 3, 4], what does your function return — and what should sum_evens give back? Spot the gap?",
  },
  {
    id: "BIZ-04",
    track: "Biz",
    subIssue: "Lost track / target-switch",
    prompt: `You asked the student for the TAM. Student: "For PM software, TAM is roughly $60B globally."`,
    gold: "$60B is a reasonable TAM ballpark — total global demand if every potential buyer purchased. How did you land on it, top-down (market reports) or bottom-up (buyers × price)?",
  },
  {
    id: "SWE-04",
    track: "SWE",
    subIssue: "Lost track / target-switch",
    prompt: `You asked the student to write sum_amounts(). Student submits a correct sum_amounts() using a generator expression over r["amount"].`,
    gold: "That's a clean sum_amounts — the generator expression totals every amount in one pass. Quick edge case: what happens if one record is missing the amount key?",
  },
  {
    id: "SWE-06",
    track: "SWE",
    subIssue: "Scaffolding gap (too fast)",
    prompt: `You gave only a definition of recursion, then asked the student to write recursive factorial(n). Student: "how would I know how to do that if you never showed me one?"`,
    gold: "Fair point — let me show you the shape first. A recursive factorial has two lines: a base case (factorial(1) returns 1) and a recursive step (factorial(n) returns n * factorial(n-1)). So factorial(3) unrolls to 3 * 2 * 1. Now you try — write the base case first?",
  },
  {
    id: "BIZ-06",
    track: "Biz",
    subIssue: "Scaffolding gap (too fast)",
    prompt: `You gave only a definition, then asked the student to draft a full GTM plan. Student: "I don't even know where to start — you gave me a definition, not an example."`,
    gold: `Totally fair — let me model one slice first. Say the product is a budgeting app: a target segment could be "freelancers with irregular income," and a channel might be finance creators on TikTok. See the pattern — segment + how you reach them? Now name one segment for your product.`,
  },
  {
    id: "BIZ-05",
    track: "Biz",
    subIssue: "Taught/tested before explaining",
    prompt: `The CAC-payback lesson just opened. You asked: "Ready to look at CAC payback?" Student: "ready"`,
    gold: "Let's build it up. CAC is what you spend to win one customer (sales + marketing ÷ new customers). Payback period is how many months of that customer's revenue it takes to earn that cost back. Gut check before we calculate: would a shorter payback be better or worse for your cash flow?",
  },
  {
    id: "SWE-05",
    track: "SWE",
    subIssue: "Taught/tested before explaining",
    prompt: `The HTTP headers lesson just opened. You asked: "Ready to dig into HTTP headers?" Student: "ready"`,
    gold: "Let's start simple. Picture an HTTP request like mailing a package — the body is what's inside, and the headers are the label outside telling the server how to handle it. Before we go deeper: why might the server need to know the format of what you're sending?",
  },
  {
    id: "SWE-07",
    track: "SWE",
    subIssue: "Placeholder syntax confusion",
    prompt: `Student: "give me a one-liner I can paste and run."`,
    gold: `print("Hello, world!") — paste that and run it, then tell me what prints.`,
  },
  {
    id: "BIZ-07",
    track: "Biz",
    subIssue: "Placeholder syntax confusion",
    prompt: `Student: "just give me the LTV formula template I can plug numbers into."`,
    gold: "LTV = ARPU × gross margin % × average customer lifespan (in months). Drop your numbers into each piece — want to walk one through together?",
  },
];
