# Flow-Arch

> Declarative. Pure functions. No side effects. No framework lock-in.

Flow-Arch is an open exploration of one idea:
**what happens when you apply pure functional, declarative thinking across the entire stack** —
from a single web component to a backend data pipeline?

This is not a finished framework. It is a methodology, a set of demos, and a growing record
of what this approach can and cannot do.

---

## The Core Idea

Most software bugs come from the same two sources: **hidden state** and **unexpected side effects**.

Flow-Arch proposes a discipline — not a library — to eliminate both:

```
Pure function:    same input → same output, always
Declarative:      describe what you want, not how to get there
Unidirectional:   data flows in one direction only
Side effects:     isolated at the boundary, never in the core logic
```

If a function is pure and declarative, it is **trivially testable**, **predictable by construction**,
and **safe to compose**. This is true whether the function renders a UI component
or transforms a data pipeline.

---

## Project Structure

```
flow-arch/
│
├── index.html                 ← flow-arch/vanilla project homepage
├── flowcore-index.html        ← flow-arch/core project homepage
│
├── flow-vanilla/              ← Pure frontend: Web Components + pure functions
│   ├── frontend/
│   │   ├── core/              ← Shared vanilla-flow primitives
│   │   └── demos/             ← Official exploration demos (TS/JS, React, Elm)
│   └── README.md
│
├── flow-core/                 ← Backend + data pipelines + React/Elm pure patterns
│   ├── backend/
│   │   └── demos/             ← Official backend demos (TS/JS, Haskell, Scala, Elixir)
│   └── README.md
│
├── flow-explore/              ← Future: algorithms, AI, and experimental research
│
├── community/                 ← All community contributions live here
│   ├── flow-vanilla/          ← Community frontend demos
│   ├── flow-core/             ← Community backend / data demos
│   └── README.md
│
├── flow-starter/              ← Beginner tutorials (Web Components, Shadow DOM, etc.)
├── docs/                      ← Official documented Flow-Arch workflows and patterns
├── experiments/               ← Active research: DOM diff, SSR, async, global state
│
├── CONTRIBUTING.md            ← How to contribute
├── limitations.html           ← Honest record of what Flow-Arch cannot do yet
└── CHANGELOG.md
```

---

## flow-arch/vanilla

**The pure frontend layer.**

`index.html` is the project homepage.

The methodology combines four browser-native ideas into one discipline:

| Concept                      | Role                                                         |
| ---------------------------- | ------------------------------------------------------------ |
| **Web Components**           | Custom elements — zero dependencies, native browser standard |
| **Shadow DOM**               | True style and DOM encapsulation — no CSS leaks              |
| **Pure Functions**           | Reducer + View — deterministic, testable, no side effects    |
| **Unidirectional Data Flow** | State → View → Action → Reducer → new State                  |

The pattern in every vanilla-flow component:

```javascript
// 1. State — plain object, single source of truth
const createInitialState = () => ({ count: 0 });

// 2. Reducer — pure function, all logic lives here
const reducer = (state, action) => {
  switch (action.type) {
    case "INCREMENT":
      return { ...state, count: state.count + 1 };
    default:
      return state;
  }
};

// 3. View — pure function, state in → HTML string out
const view = (state) => `
  <div class="count">${state.count}</div>
  <button data-action="INCREMENT">+</button>
`;

// 4. Web Component — the only place side effects live
class FlowCounter extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.state = createInitialState();
    this.dispatch = (action) => {
      this.state = reducer(this.state, action);
      this.render();
    };
  }
  connectedCallback() {
    this.render();
    this.shadowRoot.addEventListener("click", (e) => {
      const type = e.target.dataset.action;
      if (type) this.dispatch({ type });
    });
  }
  render() {
    this.shadowRoot.innerHTML = view(this.state);
  }
}

customElements.define("flow-counter", FlowCounter);
```

**Official demos** live in `flow-vanilla/frontend/demos/` — covering vanilla JS/TS, and reference
implementations in React and Elm for comparison.

---

## flow-arch/core

**The pure backend and data processing layer.**

`flowcore-index.html` is the project homepage.

The same philosophy — pure functions, declarative style — applied to:

- Backend API handlers (Cloudflare Workers, serverless edge functions)
- Data transformation pipelines
- React Server Components (pure render functions at scale)
- Elm (enforced purity, zero runtime errors)
- Haskell (IO Monad, type classes — the theoretical foundation)
- Scala (Cats Effect, ZIO — industrial pure functional)
- Elixir/Erlang (pure + distributed + fault-tolerant)

The pattern:

```
Request → validate(req) → Input
Input   → transform(input) → Result
Result  → respond(result) → Response

Every step is a pure function.
Side effects (DB, API, logging) live at the boundary only.
```

**Official demos** live in `flow-core/backend/demos/`.

---

## flow-explore

**Future territory — not yet defined.**

`flow-explore` is reserved for experimental work that does not fit neatly into
frontend or backend categories. Current candidates:

- **Algorithm exploration** — can complex algorithms be expressed as pure function compositions?
- **AI + pure functions** — using strong types and declarative DSLs to guide and verify AI-generated code
- **Formal verification** — can Flow-Arch patterns be formally proven correct?
- **Cross-language pipelines** — pure data flowing from Haskell → TypeScript → browser

This folder is intentionally vague. If you have an idea that belongs here, open a Discussion.

---

## flow-starter

**Beginner tutorials.** Linked from the main homepage.

Currently covers:

- What is a Web Component? (with live demos)
- What is Shadow DOM?
- Pure functions vs impure functions
- Declarative vs imperative style
- The complete Flow-Arch loop

If you find an explanation unclear, improving `flow-starter` content is a welcome contribution.

Beginner tutorials linked from the main homepage.

| Tutorial                                        | Topic                                                                                  |
| ----------------------------------------------- | -------------------------------------------------------------------------------------- |
| [tutorial-00](./flow-starter/tutorials/T-00.md) | Declarative thinking & pure functions — the foundation                                 |
| [tutorial-01](./flow-starter/tutorials/T-01.md) | Why `for` / `while` / `if` Make Your Brain Work Harder                                 |
| [tutorial-02](./flow-starter/tutorials/T-02.md) | Pure Functions: What They Really Are (And What Breaks Them)Harder                      |
| [tutorial-03](./flow-starter/tutorials/T-03.md) | Lazy Evaluation: Why `.map()` Is Eager and What To Do About It                         |
| Harder                                          |
| [tutorial-04](./flow-starter/tutorials/T-04.md) | Eager vs Lazy: What They Are, Every Lazy Pattern, and Why flow-arch Cares              |
|                                                 |
| [tutorial-05](./flow-starter/tutorials/T-05.md) | The Syntax Reference: Every Tool, What It Does, and Where It Belongs in flow-arch      |
| [tutorial-06](./flow-starter/tutorials/T-06.md) | Loops Dissected: `for`, `for/in`, `while`, `do/while` and Their flow-arch Replacements |
|                                                 |

<!-- | [tutorial-01](./flow-starter/tutorial-01.md) | What is a Web Component? | -->
<!-- | [tutorial-02](./flow-starter/tutorial-02.md) | Shadow DOM and style isolation | -->

---

## docs/

**The official Flow-Arch documented workflow.**

`docs/` contains only methodology that has been validated through demos and exploration.
Content here is not aspirational — it reflects what has actually been tested.

Community-contributed patterns that prove valuable may be adopted into `docs/` over time.
That process happens through Discussion and PR review, not automatically.

---

## Community Contributions

All community contributions live under `community/`.

### Where to put your work

| You are contributing...                     | Put it here                                          |
| ------------------------------------------- | ---------------------------------------------------- |
| A frontend demo using vanilla-flow patterns | `community/flow-vanilla/`                            |
| A backend / data pipeline demo              | `community/flow-core/`                               |
| An experimental idea                        | `community/flow-vanilla/` or open a Discussion first |

### Naming convention

```
community/flow-vanilla/[your-github-name]-[demo-name]-[language]/
community/flow-core/[your-github-name]-[demo-name]-[language]/

Examples:
  community/flow-vanilla/alice-todo-list-TS/
  community/flow-vanilla/bob-dark-mode-toggle-JS/
  community/flow-core/carol-user-pipeline-Haskell/
  community/flow-core/dave-api-handler-Elixir/
```

### Every community demo must include a README.md

````markdown
# [Demo Name]

## What this explores

One or two sentences about the concept or problem this demo addresses.

## Language & environment

- Language: TypeScript 5.x / Haskell GHC 9.x / Elixir 1.x / etc.
- Runtime: Node 20 / Bun / Deno / GHC / Beam VM / etc.
- Dependencies: none / list them with versions

## Setup

```bash
# exact commands to run this demo
npm install   # only if unavoidable — explain why
open index.html
```
````

## How it follows Flow-Arch principles

- [ ] Pure reducer / transformation functions
- [ ] View or output is a pure function of input
- [ ] Side effects isolated at boundary
- [ ] No hidden state

## What I found

Honest observations. What worked, what didn't, what surprised you.
Known limitations of this specific demo.
If you hit a wall, document the wall — that is valuable data.

## Known issues

List anything incomplete, broken, or not yet solved.

The **"What I found"** section is the most important part of any community README.
Failures and limitations documented honestly are more valuable than polished successes.

---

## If you used Flow-Arch principles in your own repository

You do not need to submit code here to be part of the conversation.

If you applied declarative pure function patterns in your own project and want to share it:

1. **Open a Discussion** in this repository and describe what you built and what you learned
2. **Mention `@flow-arch-dev`** in your own repository's README, Issues, or PRs —
   GitHub will notify the maintainer and create a visible connection
3. Add the topic tag `flow-arch` to your GitHub repository
   (Repository Settings → Topics → add `flow-arch`) —
   this makes your repo discoverable via GitHub topic search

> **How `@flow-arch-dev` notifications work:**
> On GitHub, mentioning `@flow-arch-dev` in any public Issue, PR, or Discussion
> automatically sends a notification to the account. No special setup needed —
> just use `@flow-arch-dev` and the maintainer will see it.

---

## Suggesting changes to the website

The main website (`index.html`, `flowcore-index.html`, `flow-starter/`, `limitations.html`)
is part of the repository. If you have a constructive suggestion:

- **Small fix** (typo, broken link, unclear wording): open a PR directly
- **Larger change** (new section, restructuring): open a Discussion first
- **New tutorial** for `flow-starter/`: follow the same structure as existing tutorials
  and open a PR with your HTML file

All website feedback is welcome. The goal is clarity, not perfection.

---

## What Flow-Arch is not

- **Not a production framework** — this is an exploration, not a library you should ship
- **Not prescriptive** — the patterns here are proposals, not mandates
- **Not complete** — see `limitations.html` for an honest record of what does not work yet
- **Not in competition** with React, Vue, Svelte, or any other framework —
  it learns from all of them

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full guide.

The short version:

```

1. Fork the repo
2. Create your demo in community/flow-vanilla/ or community/flow-core/
3. Include a README.md with "What I found"
4. Open a Pull Request

```

Questions? Open a [GitHub Discussion](../../discussions). No question is too basic.

---

## License

See [LICENSE](./LICENSE).

---

_Flow-Arch is not a framework. It is a way of thinking about data._
