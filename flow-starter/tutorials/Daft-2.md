# Tutorial 05 — Immutability in Practice: Spread, Freeze, and Structural Sharing

> **flow-arch / flow-starter**
> Tutorial-04 showed you how to wrap imperative loops declaratively.
> This tutorial covers the other side of the same coin:
> **what happens to your data while it flows through the pipeline.**
> The answer should always be: nothing. Data is never modified in place.
> This is immutability — and it has more depth than it first appears.

---

## Why immutability is not optional in flow-arch

In tutorial-02, you saw that mutating object properties inside `.map()` breaks purity:

```javascript
// ❌ Breaks purity — modifies original data
const result = items.map(item => {
  item.price = item.price * 2;  // mutation
  return item;
});
```

But immutability is not just a rule to follow.
It is the structural guarantee that makes everything else in flow-arch work.

```
Pure functions require immutability
  → because a function that modifies its input is not pure

Memoization requires immutability
  → because cached results are only safe if inputs never change

Predictable state requires immutability
  → because if state can be mutated anywhere, it can be wrong anywhere

Time-travel debugging requires immutability
  → because you can only go back if old states still exist
```

Immutability is the foundation. Everything above it depends on it.

---

## 1. The mutation problem — why it's sneaky

Mutation is the default in JavaScript. The language does not protect you from it.

```javascript
// This looks like a copy — it is not
const original = { name: "Austin", scores: [90, 85, 92] };
const copy = original;

copy.name = "Bob";
console.log(original.name);  // → "Bob"
// original was modified — copy is just another reference to the same object
```

```javascript
// This looks safe — it is not
const processUser = (user) => {
  user.active = false;    // mutation — modifies the original
  return user;
};

const user = { name: "Austin", active: true };
const result = processUser(user);
console.log(user.active);   // → false — the original was changed
```

The function returned `user` — but it also silently changed the object it received.
The caller cannot tell. The signature gives no warning.

This is how hidden state enters a codebase.
Not through global variables. Through functions that quietly modify what they receive.

---

## 2. Shallow copy vs deep copy — the critical distinction

JavaScript gives you several ways to copy objects. They are not equivalent.

### The spread operator — shallow copy

```javascript
const original = { name: "Austin", address: { city: "Shenzhen" } };

// Spread creates a NEW object — but only copies top-level properties
const copy = { ...original };

copy.name = "Bob";
console.log(original.name);          // → "Austin" ✅ top-level property: safe

copy.address.city = "Beijing";
console.log(original.address.city);  // → "Beijing" ❌ nested object: still shared
```

**Why spread is shallow:**

```
original = { name: "Austin", address: → [Object A] }
copy     = { name: "Austin", address: → [Object A] }  ← same reference

Changing copy.name creates a new string — does not affect original.name
Changing copy.address.city modifies [Object A] — which both point to
```

### When spread is sufficient

For flat objects — objects with no nested references — spread is completely safe:

```javascript
// ✅ Safe with spread — all values are primitives
const user = { id: 1, name: "Austin", age: 30, active: true };

const updated = { ...user, age: 31 };
// user is unchanged. updated has a new age value.
// No mutation risk — all properties are primitives (numbers, strings, booleans)
```

### When spread is not sufficient

```javascript
// ❌ Dangerous with spread — nested objects are still shared
const state = {
  user: { name: "Austin", preferences: { theme: "dark" } },
  items: [1, 2, 3]
};

const updated = { ...state, user: { ...state.user } };
// state.user is now a new object — safe
// state.user.preferences is still shared — not safe

updated.user.preferences.theme = "light";
console.log(state.user.preferences.theme);  // → "light" ❌
```

**The rule for spread:**

> Use spread when you are only modifying top-level properties.
> When modifying nested properties, spread each level you touch.

```javascript
// ✅ Correct — spread every level you modify
const updated = {
  ...state,
  user: {
    ...state.user,
    preferences: {
      ...state.user.preferences,
      theme: "light"             // only this property changes
    }
  }
};
// state is untouched at every level
```

---

## 3. Structural sharing — why immutability is not expensive

A common objection: *"If I create a new object for every change, won't that be slow?"*

The answer is: **structural sharing** means most of the data is not copied at all.

```javascript
const state = {
  user:  { name: "Austin", age: 30 },   // Object A
  items: [1, 2, 3],                      // Array B
  theme: "dark"
};

// Only changing the theme
const updated = { ...state, theme: "light" };

// What exists in memory:
// state   = { user: →A, items: →B, theme: "dark" }
// updated = { user: →A, items: →B, theme: "light" }
//                   ↑           ↑
//             same references — no copy made

// Object A and Array B are SHARED between state and updated
// Only the new string "light" was allocated
// Cost: one new object wrapper + one new string
```

The objects and arrays that did not change are **shared by reference** between the old and new state.
No copying. No duplication.

This is how immutable data structures work efficiently.
You never copy the data you did not touch.

### Tracing a reducer update

```javascript
const state = {
  user:  { name: "Austin", score: 90 },
  items: [{ id: 1, value: 10 }, { id: 2, value: 20 }],
  filter: "active"
};

// Action: update item 1's value to 15
const reducer = (state, action) => {
  switch (action.type) {
    case 'UPDATE_ITEM':
      return {
        ...state,                          // new top-level object
        items: state.items.map(item =>     // new array
          item.id === action.id
            ? { ...item, value: action.value }  // new object for changed item
            : item                              // SAME reference for unchanged items
        )
      };
    default:
      return state;
  }
};

const next = reducer(state, { type: 'UPDATE_ITEM', id: 1, value: 15 });

// Memory after update:
// state.user      →  Object A (unchanged, shared)
// state.filter    →  "active" (unchanged, shared)
// state.items[1]  →  Object B (id:2, unchanged, shared)
// next.items[0]   →  NEW object { id:1, value:15 }
// next.items      →  NEW array [newObj, →B]
// next            →  NEW object { user:→A, items:newArr, filter:"active" }

// Allocations: 3 new objects (top state, new items array, new item)
// Shared:      user object, "active" string, item[1] object
```

The cost of one state update is three small object allocations.
This is negligible. The shared data costs nothing.

---

## 4. `Object.freeze()` — enforced immutability

Spread and careful coding are convention-based immutability — you trust yourself not to mutate.

`Object.freeze()` is enforcement-based — JavaScript will refuse to mutate.

```javascript
const config = Object.freeze({
  apiUrl: "https://api.example.com",
  timeout: 5000,
  retries: 3
});

config.timeout = 10000;       // silently fails in sloppy mode
config.newProp = "value";     // silently fails in sloppy mode
delete config.retries;        // silently fails in sloppy mode

console.log(config.timeout);  // → 5000 — unchanged

// In strict mode ('use strict'), these throw TypeError
```

### freeze is shallow too

```javascript
const state = Object.freeze({
  user: { name: "Austin" },   // this nested object is NOT frozen
  count: 0
});

state.count = 1;              // ❌ fails — frozen
state.user.name = "Bob";      // ✅ works — nested object is not frozen
```

### Deep freeze — when you need full protection

```javascript
// Recursive deep freeze
const deepFreeze = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;

  Object.getOwnPropertyNames(obj).forEach(name => {
    deepFreeze(obj[name]);    // freeze nested objects first
  });

  return Object.freeze(obj);
};

const config = deepFreeze({
  api: { url: "https://api.example.com", timeout: 5000 },
  features: { darkMode: true, beta: false }
});

config.api.url = "http://evil.com";  // ❌ fails — deeply frozen
config.features.beta = true;          // ❌ fails — deeply frozen
```

### When to use freeze in flow-arch

```javascript
// ✅ Use freeze for:

// 1. Configuration objects — should never change at runtime
const CONFIG = deepFreeze({
  endpoints: { users: '/api/users', items: '/api/items' },
  pagination: { defaultSize: 20, maxSize: 100 }
});

// 2. Initial state — prevents accidental mutation of the starting point
const INITIAL_STATE = deepFreeze({
  user: null,
  items: [],
  loading: false,
  error: null
});

// 3. Action type constants
const ACTIONS = deepFreeze({
  SET_USER:    'SET_USER',
  ADD_ITEM:    'ADD_ITEM',
  SET_LOADING: 'SET_LOADING'
});

// ❌ Do NOT use freeze for:
// — State objects that pass through reducers (creates new objects anyway)
// — Large arrays that need frequent transformation
// — Objects returned from APIs (you cannot freeze before you receive them)
```

---

## 5. Array immutability — the methods that mutate vs those that don't

This is where JavaScript is most confusing.
Some array methods return a new array. Some mutate in place. The names give no hint.

### Methods that return a new array (safe)

```javascript
const arr = [1, 2, 3, 4, 5];

arr.map(x => x * 2)        // → [2, 4, 6, 8, 10]  — arr unchanged
arr.filter(x => x > 2)     // → [3, 4, 5]          — arr unchanged
arr.slice(1, 3)             // → [2, 3]             — arr unchanged
arr.concat([6, 7])          // → [1,2,3,4,5,6,7]   — arr unchanged
arr.reduce((a, b) => a + b) // → 15                 — arr unchanged
[...arr, 6]                 // → [1,2,3,4,5,6]     — arr unchanged
arr.flatMap(x => [x, x])   // → [1,1,2,2,3,3,4,4,5,5] — arr unchanged
```

### Methods that mutate in place (dangerous in flow-arch)

```javascript
const arr = [1, 2, 3, 4, 5];

arr.push(6)       // mutates arr → [1,2,3,4,5,6]  returns new length
arr.pop()         // mutates arr → [1,2,3,4,5]    returns removed element
arr.shift()       // mutates arr → [2,3,4,5]      returns removed element
arr.unshift(0)    // mutates arr → [0,2,3,4,5]    returns new length
arr.splice(1, 2)  // mutates arr → [0,4,5]        returns removed elements
arr.sort()        // mutates arr — sorts in place
arr.reverse()     // mutates arr — reverses in place
arr.fill(0)       // mutates arr — fills with value
```

### The immutable equivalents

```javascript
// Instead of push — add to end
const withNew = [...arr, newItem];

// Instead of unshift — add to beginning
const withFirst = [newItem, ...arr];

// Instead of splice — remove at index
const without = arr.filter((_, i) => i !== targetIndex);

// Instead of splice — insert at index
const withInserted = [
  ...arr.slice(0, index),
  newItem,
  ...arr.slice(index)
];

// Instead of sort — sort without mutating
const sorted = [...arr].sort((a, b) => a - b);

// Instead of reverse
const reversed = [...arr].reverse();
// or: arr.slice().reverse()
```

**The pattern for sort and reverse:**

```javascript
// ❌ Mutates original
arr.sort();

// ✅ Spread first, then sort — creates a new array, sorts that
[...arr].sort((a, b) => a - b);

// Why spread first:
// arr.sort() sorts arr in place AND returns arr (same reference)
// [...arr].sort() sorts a new copy — original arr is untouched
```

---

## 6. The immutable update patterns in flow-arch reducers

Reducers are where immutability is most important and most tested.

```javascript
// Starting state
const state = {
  users: [
    { id: 1, name: "Austin", active: true,  score: 90 },
    { id: 2, name: "Bob",    active: false, score: 75 },
    { id: 3, name: "Carol",  active: true,  score: 88 }
  ],
  filter: "all",
  loading: false
};
```

### Pattern 1 — Update a scalar property

```javascript
// ✅ Update a top-level primitive
case 'SET_FILTER':
  return { ...state, filter: action.payload };
  // state.users, state.loading — unchanged, shared by reference
```

### Pattern 2 — Update one item in an array by ID

```javascript
// ✅ Update specific item — others shared by reference
case 'UPDATE_SCORE':
  return {
    ...state,
    users: state.users.map(user =>
      user.id === action.id
        ? { ...user, score: action.score }  // new object for changed user
        : user                               // same reference for others
    )
  };
```

### Pattern 3 — Add an item to an array

```javascript
// ✅ Add to array — original array never mutated
case 'ADD_USER':
  return {
    ...state,
    users: [...state.users, action.user]   // new array with new item appended
  };
```

### Pattern 4 — Remove an item from an array

```javascript
// ✅ Remove by ID — filter creates new array
case 'REMOVE_USER':
  return {
    ...state,
    users: state.users.filter(user => user.id !== action.id)
  };
```

### Pattern 5 — Toggle a boolean on one item

```javascript
// ✅ Toggle active status for one user
case 'TOGGLE_ACTIVE':
  return {
    ...state,
    users: state.users.map(user =>
      user.id === action.id
        ? { ...user, active: !user.active }
        : user
    )
  };
```

### Pattern 6 — Update deeply nested property

```javascript
// State with deep nesting
const state = {
  user: {
    profile: {
      address: {
        city: "Shenzhen",
        country: "China"
      }
    }
  }
};

// ✅ Update nested property — spread each level
case 'UPDATE_CITY':
  return {
    ...state,
    user: {
      ...state.user,
      profile: {
        ...state.user.profile,
        address: {
          ...state.user.profile.address,
          city: action.city
        }
      }
    }
  };
// Every level above the changed property gets a new object
// The changed property gets a new value
// Nothing else is touched
```

---

## 7. When deep nesting becomes a problem

The pattern above for deeply nested state is correct but verbose.
Three levels of nesting is manageable. Six levels is a smell.

Deep nesting in state is usually a sign that the state shape needs to be flattened.

```javascript
// ❌ Too deeply nested — updates are verbose and error-prone
const state = {
  data: {
    users: {
      byId: {
        "1": {
          profile: {
            preferences: {
              theme: "dark"
            }
          }
        }
      }
    }
  }
};

// ✅ Flatter — easier to update immutably
const state = {
  usersById: {
    "1": { id: "1", name: "Austin", theme: "dark" }
  },
  userIds: ["1"]
};

// Update is now simple
case 'SET_THEME':
  return {
    ...state,
    usersById: {
      ...state.usersById,
      [action.userId]: {
        ...state.usersById[action.userId],
        theme: action.theme
      }
    }
  };
```

**The rule:** if your immutable update requires more than three levels of spread,
consider whether your state shape should be flatter.

---

## 8. Immutability in the view layer

Immutability applies to the view layer too.
The `view` function receives state and produces HTML — it must not modify state while doing so.

```javascript
// ❌ View function modifies state — breaks purity
const view = (state) => {
  state.renderCount = (state.renderCount || 0) + 1;  // mutation
  return `<div>${state.items.map(toListItem).join('')}</div>`;
};

// ✅ View function is pure — state flows in, HTML flows out
const toListItem = (item) => `<li class="${item.active ? 'active' : ''}">${item.name}</li>`;

const view = (state) =>
  `<div>${state.items.map(toListItem).join('')}</div>`;

// Render count lives in the boundary layer, not the view
```

---

## Summary

| Concept | What to remember |
|---|---|
| **Why immutability** | Required for pure functions, memoization, predictable state |
| **Spread is shallow** | Only copies top-level properties — nested objects are still shared |
| **Structural sharing** | Unchanged parts are shared by reference — no copy, no cost |
| **`Object.freeze()`** | Enforces immutability — but only one level deep |
| **`deepFreeze()`** | Recursively freezes — use for config and constants |
| **Mutating array methods** | `push`, `pop`, `sort`, `splice`, `reverse` — always spread first |
| **Safe array methods** | `map`, `filter`, `slice`, `concat`, `flatMap` — return new arrays |
| **Reducer patterns** | Spread top level, spread each level you touch, share the rest |
| **Deep nesting smell** | More than three spread levels — consider flattening the state shape |
| **View layer** | View function must not modify state — state in, HTML out, nothing else |

---

## The complete immutability checklist for flow-arch

```
When writing a transformation function:
  ✅ Does it receive data as parameters?
  ✅ Does it return new data (not modify the input)?
  ✅ Are all nested objects spread if modified?
  ✅ Are arrays created with map/filter/slice, not push/splice?
  ✅ Does the function's output depend only on its inputs?

When writing a reducer:
  ✅ Does every case return a new state object?
  ✅ Is the default case returning the original state (not a copy)?
  ✅ Are nested updates spreading every level they touch?
  ✅ Are unchanged properties shared by reference (not needlessly copied)?

When writing a view function:
  ✅ Does it only read from state — never write to it?
  ✅ Does it return a value — not produce side effects?
  ✅ Could it be called twice with the same state and return the same HTML?
```

---

## What's next

- [Tutorial 06 — The Web Component shell: where side effects live](./tutorial-06.md)
- [Tutorial 07 — The reducer pattern: state machines without classes](./tutorial-07.md)
- [Back to Tutorial 04 — Declarative patterns for streams, polling, and traversal](./tutorial-04.md)
- [See the live demos](../index.html)

---

*flow-arch / flow-starter · tutorial-05*
*This document is part of the flow-arch open exploration project.*
*Contributions welcome — see [CONTRIBUTING.md](../CONTRIBUTING.md)*
