// ✅ Pure — both rules satisfied
const double = (n) => n * 2;
double(4); // → 8, always, forever

// ❌ Breaks Rule 1 — same input, different output possible
let multiplier = 2;
const scale = (n) => n * multiplier;
scale(4); // → 8 now
multiplier = 3;
scale(4); // → 12 now — same input, different output

// ❌ Breaks Rule 2 — modifies something outside itself
const log = [];
const trackDouble = (n) => {
  log.push(n); // side effect: modifying external array
  return n * 2;
};
trackDouble(4); // → 8, log is now [4]
trackDouble(5); // → 10, log is now [4, 5]

// This looks declarative and clean
const result = items
  .map((x) => x.values)
  .reduce((a, b) => a.concat(b), [])
  .map((v) => v * factor) // ← the problem is here
  .reduce((sum, v) => sum + v, 0);

// Scenario that breaks purity
let factor = 2;

const processItems = (items) =>
  items
    .flatMap((x) => x.values)
    .map((v) => v * factor) // depends on external factor
    .reduce((sum, v) => sum + v, 0);

processItems(data); // → 100 (factor = 2)
factor = 3;
processItems(data); // → 150 — same input, different output
// ❌ Not deterministic — Rule 1 broken

// ✅ Pure — factor is now a parameter
const processItems1 = (items, factor) =>
  items
    .flatMap((x) => x.values)
    .map((v) => v * factor)
    .reduce((sum, v) => sum + v, 0);
1;

processItems(data, 2); // → 100, always
processItems(data, 2); // → 100, always — deterministic

// ✅ Fine — PI is a primitive constant, truly immutable
const PI = 3.14159;
const circleArea = (r) => PI * r * r;

// ❌ Not fine — const object, but its contents can still mutate
const config = { factor: 2 };
const scale1 = (n) => n * config.factor;
config.factor = 3; // this works — config is mutated
scale1(4); // → 12 now, not 8

const items = [
  { name: "a", price: 10 },
  { name: "b", price: 20 },
];

// ❌ Looks like a transformation — is actually mutation
const result1 = items.map((item) => {
  item.price = item.price * 2; // modifying the original object
  return item;
});
console.log(items[0].price); // → 20 — the original was changed
// Rule 2 broken — modified something outside the function

// The fix — always return a new object:
// ✅ Pure — creates a new object, never touches the original
const result2 = items.map((item) => ({
  ...item, // copy all existing properties
  price: item.price * 2, // override only what changes
}));

console.log(items[0].price); // → 10 — original unchanged

// Logging inside transformation:
// ❌ Impure — console.log is a side effect
const result3 = items.map((item) => {
  console.log("processing:", item); // side effect
  return item.value * 2;
});

// ✅ Pure — no side effects inside the transformation
const result4 = items.map((item) => item.value * 2);

// If you need to debug, do it at the boundary
console.log("input:", items);
const result5 = items.map((item) => item.value * 2);
console.log("output:", result5);

// ❌ Impure — modifies external counter from inside a transformation
let totalProcessed = 0;

const view = (items) =>
  items.map((item) => {
    totalProcessed++; // side effect
    return `<li>${item.name}</li>`;
  });

// ✅ Pure — view only transforms data to HTML
const toListItem = (item) => `<li>${item.name}</li>`;
const view1 = (items) => items.map(toListItem).join("");

// Counting happens at the boundary, not inside the transformation

// ❌ Impure — reads from global state directly
const getActiveItems = () =>
  window.appState.items.filter((item) => item.active);
// Same call at different times returns different results
// depending on what window.appState contains at that moment

// ✅ Pure — receives state as a parameter
const getActiveItems1 = (items) => items.filter((item) => item.active);

// The caller controls what data goes in
const active = getActiveItems1(state.items);

// ✅ Pure reducer — state comes in as a parameter, never read from outside
const reducer = (state, action) => {
  switch (action.type) {
    case "FILTER_ACTIVE":
      return {
        ...state,
        items: state.items.filter((item) => item.active),
      };
    default:
      return state;
  }
};
// Same state + same action → same new state, always

// 3. Why purity matters so much in flow-arch
// Testability — zero setup required

// Pure function — testing is trivial
const isActive = (item) => item.active === true;

expect(isActive({ active: true })).toBe(true); // one line
expect(isActive({ active: false })).toBe(false); // one line
// No setup. No mocks. No teardown.

// Impure function — testing is painful
const getActiveFromGlobal = () => window.appState.items.filter((i) => i.active);

// Must construct the entire global environment first
window.appState = { items: [{ active: true }, { active: false }] };
expect(getActiveFromGlobal()).toEqual([{ active: true }]);
// Must clean up — or tests interfere with each other
delete window.appState;

// Because each function is pure, you can compose them freely
// Inserting, removing, or reordering steps cannot break other steps
const processItems2 = (items, factor) =>
  items
    .filter(isActive) // pure — safe to remove or reorder
    .map(toValue) // pure — safe to remove or reorder
    .map((v) => v * factor) // pure — factor is a parameter
    .reduce(sum, 0); // pure — safe to remove or reorder

// Pure functions are deterministic — the same input always gives the same output
// This makes it safe to cache results

const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

// Safe to memoize because it's pure
const expensiveTransform = memoize((items, factor) =>
  items
    .flatMap((x) => x.values)
    .map((v) => v * factor)
    .reduce((sum, v) => sum + v, 0),
);

expensiveTransform(data, 2); // computed — takes 50ms
expensiveTransform(data, 2); // from cache — takes 0ms

// Pure functions share no state
// Two pure functions can run simultaneously without interfering

const [result6, result7] = await Promise.all([
  processItems(dataset1, factor), // pure
  processItems(dataset2, factor), // pure
]);
// No race condition — they operate on separate data, share nothing

// This is also the foundation of safe concurrency in Haskell and Elixir —
// two of the languages flow-arch explores for backend pipelines

// ✅ const primitive — truly immutable, safe to close over
const PI1 = 3.14159;
const TAX_RATE = 0.08;
const APP_NAME = "flow-arch";
// Numbers, strings, booleans — const makes them truly constant

// ❌ const object — the reference is constant, the contents are not
const config = { factor: 2 };
config.factor = 3; // ✅ this works — const does not deep-freeze objects
config = {}; // ❌ this fails — can't reassign the reference

// ❌ const array — same problem
const items1 = [1, 2, 3];
items.push(4); // ✅ this works — the array is mutated
items = []; // ❌ this fails — can't reassign the reference

// ❌ flow-arch violation — implicit dependencies
const state = { items: [], factor: 2 };

const view2 = () =>
  // no parameters — reads from closure
  state.items
    .filter((item) => item.active)
    .map((item) => `<li>${item.name}</li>`)
    .join("");

// ✅ flow-arch style — all dependencies are parameters
const isActive1 = (item) => item.active;
const toListItem1 = (item) => `<li>${item.name}</li>`;

const view3 = (
  state, // state passed in explicitly
) => state.items.filter(isActive1).map(toListItem1).join("");

// ── 1. Pure transformation functions ────────────────────────────

const isActive2 = (item) => item.active;
const toValue = (item) => item.value;
const multiply = (factor) => (v) => v * factor; // curried pure function
const sum = (acc, v) => acc + v;
const toListItem2 = (item) => `<li>${item.name}</li>`;

// ── 2. Pure calculation (composable, testable, memoizable) ──────

const calculateTotal = (items, factor) =>
  items.filter(isActive).map(toValue).map(multiply(factor)).reduce(sum, 0);

// ── 3. Pure view function ────────────────────────────────────────

const view4 = (state) => `
  <div class="summary">
    <p>Total: ${calculateTotal(state.items, state.factor)}</p>
    <ul>${state.items.filter(isActive2).map(toListItem2).join("")}</ul>
  </div>
`;

// ── 4. Pure reducer ──────────────────────────────────────────────

const reducer3 = (state, action) => {
  switch (action.type) {
    case "SET_FACTOR":
      return { ...state, factor: action.payload };
    case "TOGGLE_ITEM":
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload ? { ...item, active: !item.active } : item,
        ),
      };
    default:
      return state;
  }
};

// ── 5. Boundary — side effects contained here only ───────────────

class FlowComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._state = { items: [], factor: 1 };
  }

  dispatch(action) {
    this._state = reducer(this._state, action); // pure — new state
    this.shadowRoot.innerHTML = view(this._state); // side effect — DOM write
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = view(this._state); // side effect — DOM write
  }
}

// Everything above dispatch() is pure.
// DOM mutation happens only in dispatch() and connectedCallback().
// The line between pure and impure is explicit and enforced by structure.
