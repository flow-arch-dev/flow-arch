# Limitations

> This document is a living record of what Flow-Arch cannot do well — yet.
> Honest documentation of constraints is part of the methodology.
> Every limitation listed here is an open research question.

---

## How to read this document

Each limitation has a status:

| Status | Meaning |
|--------|---------|
| `KNOWN` | Confirmed problem, no solution yet |
| `EXPLORING` | Actively experimenting with solutions |
| `PARTIAL` | Workaround exists but is not satisfying |
| `RESOLVED` | Solution found — see linked experiment |

---

## L-01 — Full innerHTML Replacement on Every Render

**Status:** `KNOWN`

### What happens
Every time state changes, the entire Shadow DOM is destroyed and rebuilt:

```javascript
render() {
  this.shadowRoot.innerHTML = view(this.state)  // full replacement
}
```

### Why it is a problem
- Input elements lose focus on every render
- CSS transitions and animations are interrupted
- Expensive for large DOM trees
- Memory pressure from constant node creation and destruction

### When it matters
- Components with `<input>` or `<textarea>` inside
- High-frequency updates (real-time data, animations)
- Large list rendering (100+ items)
- Components with CSS transitions

### When it does not matter
- Simple components updated on click (counter, toggle)
- DOM trees with fewer than ~20 nodes
- Low-frequency updates

### Open question
Can we build a minimal DOM diff algorithm in pure vanilla JS,
without dependencies, that fits the Flow-Arch philosophy?

### Related experiment
`experiments/dom-diff/` — not started yet

---

## L-02 — No Inter-Component State Management

**Status:** `KNOWN`

### What happens
Each Web Component manages its own private state.
There is no shared store or global state layer.

```javascript
// Component A has its own state
// Component B has its own state
// They cannot talk to each other — yet
```

### Why it is a problem
- Two sibling components cannot share data directly
- Parent-to-child communication requires attributes (limited to strings)
- Child-to-parent communication requires CustomEvents (verbose)
- No single source of truth across the page

### Current workaround
Use `CustomEvent` to bubble data up, and attributes to pass data down:

```javascript
// Child → Parent (dispatch event)
this.dispatchEvent(new CustomEvent("count-changed", {
  bubbles: true,
  detail: { count: this.state.count }
}))

// Parent → Child (set attribute)
childElement.setAttribute("count", newCount)
```

### Why this is not satisfying
- Verbose and repetitive
- No single source of truth
- Complex state trees become hard to manage

### Open question
Can a global store be designed as a pure function system,
consistent with the Flow-Arch philosophy, without a framework?

### Related experiment
`experiments/global-store/` — not started yet

---

## L-03 — No Async Action Handling

**Status:** `KNOWN`

### What happens
Reducers are synchronous pure functions.
There is no built-in mechanism for async operations like `fetch`.

```javascript
// This is not possible in a pure reducer
const reducer = async (state, action) => {  // ✗ not allowed
  const data = await fetch("/api/data")
  return { ...state, data }
}
```

### Why it is a problem
- API calls cannot be triggered from a reducer
- Loading and error states must be managed manually
- No standard pattern for async side effects in the flow

### Current workaround
Handle async operations in the Web Component shell,
then dispatch with the result:

```javascript
async connectedCallback() {
  this.render()

  // Fetch outside the reducer
  const res  = await fetch("/api/data")
  const data = await res.json()

  // Then dispatch synchronously
  this.dispatch({ type: "DATA_LOADED", payload: data })
}
```

### Why this is not satisfying
- Async logic scattered in lifecycle methods
- No consistent pattern across components
- No loading/error state management built in

### Open question
What is the Flow-Arch equivalent of Redux-Thunk or Redux-Saga?
Can it be designed without middleware complexity?

### Related experiment
`experiments/async-actions/` — not started yet

---

## L-04 — No Enforced Purity

**Status:** `KNOWN` · inherent to JavaScript

### What happens
Unlike Haskell or Elm, JavaScript cannot enforce that
reducers and view functions are truly pure.
A developer can write side effects inside them with no warning.

```javascript
// JS cannot stop this from compiling
const reducer = (state, action) => {
  console.log("side effect!")       // ✗ side effect
  localStorage.setItem("x", "y")   // ✗ side effect
  return { ...state }
}
```

### Why it is a problem
- Purity is a convention, not a guarantee
- A new contributor can accidentally break the contract
- No compile-time safety net

### Current approach
- Document the rules clearly in `CONTRIBUTING.md`
- Code review enforces the convention
- ESLint rules can catch some violations (e.g. `no-param-reassign`)

### Honest assessment
This limitation is **inherent to JavaScript**.
It cannot be fully solved without a type system or a compiler.
Flow-Arch accepts this and relies on discipline and documentation.

### Related reading
- Elm enforces purity at the compiler level
- Haskell uses the IO monad to isolate side effects
- TypeScript with `readonly` reduces (but does not eliminate) mutation risk

---

## L-05 — String-Based View Has No Type Safety

**Status:** `KNOWN`

### What happens
The `view` function returns an HTML string.
There is no validation that the HTML is well-formed,
no autocomplete, and no type checking on the values.

```javascript
const view = (state) => `
  <div class="cont">          <!-- typo in class name: silent failure -->
    <p>${state.usre.name}</p> <!-- typo in property: runtime error -->
  </div>
`
```

### Why it is a problem
- Typos in HTML structure fail silently
- Typos in state property names cause runtime errors
- No editor autocomplete for the HTML inside template literals
- XSS risk if user input is interpolated without sanitization

### Current workaround
Be careful. Use browser DevTools to inspect.
Sanitize any user-generated content before interpolating.

```javascript
// Sanitize user input before putting it in the view
const escape = (str) =>
  str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")

const view = (state) => `<p>${escape(state.userInput)}</p>`
```

### Open question
Could a lightweight tagged template literal function
provide basic sanitization and validation
without abandoning the pure-function view pattern?

---

## L-06 — SSR Support Is Not Yet Implemented

**Status:** `KNOWN`

### What happens
Flow-Arch components are defined and rendered entirely in the browser.
There is no server-side rendering implementation yet.

### Why it matters
- First contentful paint is slower (blank page until JS runs)
- SEO crawlers may not see component content
- Declarative Shadow DOM (the SSR solution for Web Components) is not yet used

### The solution that exists in the platform
Declarative Shadow DOM allows Shadow DOM to be rendered in HTML
without JavaScript, which solves the SSR problem for Web Components:

```html
<!-- Declarative Shadow DOM — rendered by server, no JS needed -->
<my-card>
  <template shadowrootmode="open">
    <style>p { color: #c8f542; }</style>
    <p>This renders without JavaScript</p>
  </template>
</my-card>
```

### Open question
How does Flow-Arch's State → View → Reducer loop integrate
with server-side rendering?
What does a Flow-Arch SSR pattern look like in practice?

### Related experiment
`experiments/ssr/` — not started yet

---

## L-07 — Component Reuse Requires Manual Boilerplate

**Status:** `KNOWN`

### What happens
Every Flow-Arch component repeats the same structure:
`constructor → attachShadow → state → dispatch → connectedCallback → render`.

```javascript
// Every component starts with this exact boilerplate
class MyComponent extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: "open" })
    this.state = createInitialState()
    this.dispatch = (action) => {
      this.state = reducer(this.state, action)
      this.render()
    }
  }
  connectedCallback() { this.render() }
  render() { this.shadowRoot.innerHTML = view(this.state) }
}
```

### Why it is a problem
- Repetitive across every component
- Easy to make mistakes when copying
- The boilerplate obscures the unique logic of each component

### Open question
Could a `createFlowComponent(reducer, view)` factory function
eliminate the boilerplate while keeping the philosophy intact?

```javascript
// Proposed API — not yet implemented
const FlowCounter = createFlowComponent(reducer, view)
customElements.define("flow-counter", FlowCounter)
```

This is one of the most promising paths toward a real `flow-core.js`.

---

## Summary Table

| ID | Limitation | Status | Priority |
|----|-----------|--------|----------|
| L-01 | Full innerHTML replacement | `KNOWN` | High |
| L-02 | No inter-component state | `KNOWN` | High |
| L-03 | No async action handling | `KNOWN` | Medium |
| L-04 | No enforced purity | `KNOWN` | Low (inherent) |
| L-05 | String view has no type safety | `KNOWN` | Medium |
| L-06 | No SSR implementation | `KNOWN` | Medium |
| L-07 | Component boilerplate repetition | `KNOWN` | Low |

---

## Contributing to this document

Found a limitation not listed here?

1. Open a GitHub Issue with the label `limitation`
2. Describe what you tried, what failed, and why
3. A limitation honestly documented is a valid contribution

> The goal of this document is not to list problems to be embarrassed about.
> It is to map the honest boundaries of this approach —
> so that anyone building on it knows exactly where the edges are.
