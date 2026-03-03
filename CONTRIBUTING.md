# Contributing to Flow-Arch

> Flow-Arch is an open exploration — not a finished product.
> Every contribution is a conversation about what this approach can and cannot do.

---

## What you can contribute

| Type | Where | Notes |
|------|-------|-------|
| **Frontend demo** | `community/flow-vanilla/` | vanilla JS/TS, Web Components |
| **Backend / data demo** | `community/flow-core/` | TS/JS, Haskell, Scala, Elixir, etc. |
| **Improve official demo** | `flow-vanilla/` or `flow-core/` | Open a Discussion first for larger changes |
| **Write or improve docs** | `docs/` | Validated patterns only |
| **Improve flow-starter tutorial** | `flow-starter/` | Follow existing tutorial structure |
| **Website feedback** | PR or Discussion | Small fix → PR directly. Larger change → Discussion first |
| **Architecture discussion** | GitHub Discussions | No code required |

---

## Submitting a community demo

### Step 1 — Fork and clone

```bash
git clone https://github.com/YOUR-USERNAME/flow-arch.git
cd flow-arch
```

### Step 2 — Create your folder

**Frontend demo:**
```
community/flow-vanilla/[your-github-name]-[demo-name]-[language]/
├── index.html
├── flow-yourcomponent.js   (or .ts)
└── README.md
```

**Backend / data demo:**
```
community/flow-core/[your-github-name]-[demo-name]-[language]/
├── main.ts   (or Main.hs / main.ex / etc.)
└── README.md
```

**Naming examples:**
```
community/flow-vanilla/alice-todo-list-TS/
community/flow-vanilla/bob-dark-mode-toggle-JS/
community/flow-core/carol-user-pipeline-Haskell/
community/flow-core/dave-api-handler-Elixir/
```

### Step 3 — Follow the Flow-Arch loop

**Frontend (flow-vanilla):**
```
State → View → Action → Reducer → new State
```

```javascript
// State — plain object
const createInitialState = () => ({ ... })

// Reducer — pure function, no side effects
const reducer = (state, action) => {
  switch (action.type) {
    case "YOUR_ACTION": return { ...state, ... }
    default: return state
  }
}

// View — pure function, state in → HTML string out
const view = (state) => `...${state.something}...`

// Web Component — the only place side effects are allowed
class YourComponent extends HTMLElement { ... }
customElements.define("your-component", YourComponent)
```

**Backend (flow-core):**
```
Request → validate → transform → respond
```

```typescript
// Every step is a pure function
const validate  = (req: Request): Input => { ... }
const transform = (input: Input): Result => { ... }
const respond   = (result: Result): Response => { ... }

// Side effects (DB, API calls) live at the boundary only
```

### Step 4 — Write your README.md

Every community demo requires a README with these sections:

```markdown
# [Demo Name]

## What this explores
One or two sentences about the concept or problem this demo addresses.

## Language & environment
- Language: TypeScript 5.x / Haskell GHC 9.x / etc.
- Runtime: Node 20 / Bun / Deno / GHC / BEAM VM / etc.
- Dependencies: none / list them with versions

## Setup
```bash
# exact commands to run this demo
open index.html        # for frontend demos
npx ts-node main.ts    # example for backend demos
```

## How it follows Flow-Arch principles
- [ ] Pure reducer / transformation functions
- [ ] View or output is a pure function of input
- [ ] Side effects isolated at boundary
- [ ] No hidden state

## What I found
What worked, what didn't, what surprised you.
Honest observations are more valuable than polished results.
If you hit a wall — document it. That is useful data.

## Known issues
Anything incomplete, broken, or not yet solved.
```

> The **"What I found"** section is the most important part.
> Failures and limitations documented honestly contribute more than silent successes.

### Step 5 — Open a Pull Request

```bash
git checkout -b community/your-demo-name
git add community/flow-vanilla/your-demo-name/
git commit -m "community: add your-demo-name"
git push origin community/your-demo-name
```

Then open a PR. Include a one-sentence description of what your demo explores.

---

## Rules for frontend demos (flow-vanilla)

```
✅  reducer is a pure function — no side effects inside
✅  view is a pure function — state in, HTML string out
✅  no external dependencies — no npm, no CDN libraries
✅  runs by opening index.html directly (Live Server is fine)
✅  has a README.md with all required sections
✅  component tag name contains a hyphen (web component spec requirement)
```

## Rules for backend demos (flow-core)

```
✅  transformation functions are pure — no hidden reads or writes
✅  side effects isolated at input/output boundary only
✅  README includes exact setup instructions
✅  README explains which Flow-Arch principles are demonstrated
✅  README has "What I found" section
```

---

## If you used Flow-Arch patterns in your own repository

You do not need to submit code here to participate.

**Option 1 — Open a Discussion**
Describe what you built, what language you used, and what you learned.

**Option 2 — Mention @flow-arch**
Use `@flow-arch` in your own repository's Issues, PRs, or README.
GitHub sends a notification automatically — no special setup needed.

**Option 3 — Add the topic tag**
Go to your repository → Settings → Topics → add `flow-arch`.
Your repo becomes discoverable via GitHub topic search.

---

## Improving official demos

Found a bug or a better way to write something in `flow-vanilla/` or `flow-core/`?

- **Small fix** (typo, comment, clarity): open a PR directly
- **Significant rewrite**: open a Discussion first — explain your reasoning
- Keep the **original intent** of the demo intact
- If you want to explore a different direction, create a new community demo instead

---

## Improving flow-starter tutorials

`flow-starter/` contains the beginner tutorials linked from the main homepage.

- Follow the existing HTML structure and design tokens
- Each tutorial page should have a sidebar, step sections, and live demos
- Open a Discussion if you want to add a new tutorial topic

---

## Writing or improving docs/

`docs/` contains only methodology validated through real demos.

```
docs/
├── philosophy.md
├── architecture.md
├── frontend.md
├── backend.md
├── limitations.md    ← especially welcome: new limitations discovered
└── roadmap.md
```

If you discover a real limitation not in `limitations.md`, documenting it is a valid contribution.
This project values honesty over promotion.

---

## Architecture discussions

Use **GitHub Discussions** for questions without a clear right answer.

Good topics:
- "Should the view function return a DOM tree instead of an HTML string?"
- "How would Flow-Arch handle real-time collaborative features?"
- "What would a Flow-Arch routing system look like?"
- "Is this actually better than just using Lit / SolidJS / etc.?"

Use **Issues** for:
- Bug reports in existing demos
- Broken links or errors in documentation

**Disagreement is welcome.**
If you think a design decision is wrong, say so clearly and explain why.
The goal is to find truth, not to protect ideas.

---

## What will not be merged

| Reason | Why |
|--------|-----|
| No README.md | Documentation is part of the contribution |
| Reducer has side effects | Breaks the pure function contract |
| View reads external state | Not a pure function |
| Frontend demo uses npm dependencies | Violates zero-dependency principle |
| Folder placed outside `community/` | Wrong location for community contributions |
| Core architecture rewritten without discussion | Breaking changes need consensus first |

---

## PR review process

All PRs are reviewed by the maintainer.
Typical response time: a few days to a week.

A PR can have three outcomes:

- **Merged** — meets the rules, adds value
- **Changes requested** — good idea, needs adjustment
- **Declined** — does not fit scope (you will receive a clear explanation)

Declined PRs are not failures. A demo that reveals something Flow-Arch cannot do well
is a valuable contribution when documented honestly.

---

## First time contributing to open source?

This is a good project to start with:

- No build tools required for frontend demos
- No framework to learn
- A demo is two files and a README
- Feedback is about the ideas, not about you

Unsure if your idea fits? Open a Discussion and ask first.

---

## Questions?

Open a [GitHub Discussion](../../discussions) — no question is too basic.
