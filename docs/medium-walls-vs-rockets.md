# You Are Not Writing Code. You Are Either Plastering Walls or Building Rockets.

*On why most software gets harder to change — and the architectural shift that reverses it.*

---

There is a question worth asking about any codebase you have worked in:

Does the system get easier to change as it grows?
Or harder?

For most software, the honest answer is: harder.
Every feature adds friction. Every fix risks breaking something unrelated.
Every new developer takes longer to become productive.

This is not a failure of individual programmers.
It is a failure of the underlying model.

And the model has a name.

---

## The wall metaphor

Imagine a construction crew building a wall.

They mix concrete, pour it, let it set.
Later, they discover a pipe was placed incorrectly.
They chip out a section of the wall, move the pipe, patch it.

The patch doesn't quite match. So they apply filler.
The filler cracks six months later. So they apply more filler, then paint over it.
The wall holds. But it is no longer a wall — it is a history of compromises, each one
hiding the consequences of the previous one.

Now imagine you need to move a load-bearing pipe on the fourth floor.
Every patch from the ground floor is load-bearing now.
Nobody remembers which one. Nobody dares find out.

This is what most large codebases look like from the inside.

---

## How codebases become walls

Object-oriented, imperative code creates walls through three specific mechanisms.

### Mechanism 1 — Non-standard interfaces

In a well-engineered system, components connect through standard interfaces.
A USB port accepts any USB device. A bolt fits any nut of the same thread.

In OOP codebases, each class has its own interface — shaped by whoever wrote it,
optimised for the problem they were solving at the time, with no guarantee of consistency
with anything else in the system.

```javascript
// Three different classes, three completely different interfaces
// for the same conceptual operation: get a user's display name

userService.getUserDisplayName(userId);          // async, takes ID
new UserFormatter(user).format('display');       // synchronous, takes object, returns through method
UserUtils.toDisplayString(user, { short: true }); // static utility, options object
```

To connect any two of these, you write adapter code.
To connect three of them in a pipeline, you write three adapters.

The adapters are the filler. They exist not to add logic, but to bridge incompatibilities
that should never have existed.

### Mechanism 2 — State that bleeds

Imperative programming allows — and implicitly encourages — state modification at any point.

```javascript
class OrderProcessor {
  process(order) {
    this.currentOrder = order;              // state 1
    this.validateOrder();                   // may modify this.errors
    this.calculateTotals();                 // may modify this.currentOrder.total
    this.applyDiscounts();                  // may modify this.currentOrder.items
    this.updateInventory();                 // modifies external database
    return this.currentOrder;              // returns the mutated original
  }
}
```

Each method reads and writes shared state.
The output of `process` depends not just on `order` — it depends on the current value
of every `this.*` property at the moment of the call.

Change one method, and the others may break — not because of a logic error,
but because the shared state they depend on now has a different value.

This is the cracked ceiling caused by moving a pipe in the basement.
The connection is invisible. The breakage is real.

### Mechanism 3 — The patch accumulation pattern

Once a codebase has non-standard interfaces and bleeding state,
every new feature requires navigating around the existing compromises.

```javascript
// This is a real pattern — not a caricature
function processPayment(order, user, context) {
  if (context.isLegacy) {
    if (user.type === 'premium') {
      // legacy premium path — do not touch
      return legacyPremiumProcessor.process(order);
    }
    // legacy standard — has a known bug with order.discount, handled below
  }

  if (order.discount && !context.isLegacy) {
    // discount calculation was moved here from OrderProcessor after the 2022 incident
    order = { ...order, total: order.total * (1 - order.discount) };
  }

  // ... forty more lines of similar patches
}
```

Every `if/else` in this function is a filler patch.
Someone could not change the underlying structure — so they added a condition instead.
The function now describes not the logic of payment processing,
but the history of every time the logic was wrong.

---

## The aerospace alternative

Now consider how aerospace engineers build systems.

A jet engine is designed to a specification: input (fuel + air), output (thrust),
defined tolerances, defined failure modes. The engine does not know what aircraft it is in.
The aircraft does not know how the engine generates thrust.
The interface between them is standardised.

When the engine needs to be replaced, you replace the engine.
The wings do not change. The fuel system does not change. The cockpit does not change.

This is not a philosophical preference. It is an engineering requirement.
In aerospace, the cost of an unexpected interaction is measured in lives.
So components are **physically isolated** — they cannot accidentally communicate
through shared state, because they share no state.

The question flow-arch asks is: why does software accept a lower standard?

---

## Pure functions as standardised components

A pure function has the same property as an aerospace component:
its interface is completely defined by its inputs and outputs.

```javascript
// This function's entire interface is its signature
const calculateDiscount = (price, discountRate) => price * (1 - discountRate);

// You know everything there is to know about this function:
// — Input: two numbers
// — Output: one number
// — Side effects: none
// — Shared state: none
// — Failure modes: NaN if inputs are NaN (predictable)

// It does not know what system it is in.
// It does not know what called it.
// It cannot be affected by anything outside itself.
```

This is the `M8` bolt of software.
Given the same inputs, it produces the same output.
Every time. In every context. In any system.

You can test it in isolation — one assertion, no setup:

```javascript
expect(calculateDiscount(100, 0.2)).toBe(80);
```

You can replace it without touching anything around it.
You can compose it with other pure functions without negotiating interfaces:

```javascript
// Composition: no adapter code needed
// Each function's output type matches the next function's input type
const finalPrice = applyTax(
  applyShipping(
    calculateDiscount(basePrice, discountRate),
    shippingRate
  ),
  taxRate
);
```

No adapters. No shared state. No patches.
The components connect because they were designed to connect.

---

## The pipeline as a wiring diagram

When you build a system from pure functions, the system's architecture becomes visible.

```javascript
// This is not just code — it is a wiring diagram
const processOrder = (order, config) =>
  pipe(
    validateOrder,                    // input: raw order → output: validated order or error
    calculateSubtotal,                // input: validated order → output: order with subtotal
    applyDiscount(config.discountRate), // input: order → output: order with discount
    addTax(config.taxRate),           // input: order → output: order with tax
    formatForPayment                  // input: order → output: payment payload
  )(order);
```

Read it left to right. Each stage has one job.
The data flows in one direction.
There is no shared state between stages — each stage receives a value and returns a value.

When something goes wrong, you find where the data "changes colour":

```javascript
// Debugging a pipeline — trivial
console.log('after validate:',   validateOrder(order));
console.log('after subtotal:',   calculateSubtotal(validated));
console.log('after discount:',   applyDiscount(rate)(withSubtotal));
// The error appears at exactly one stage — that is where the bug is
```

Not because you are clever. Because the architecture makes the bug **locatable**.

---

## The library accumulation effect

Here is the compounding return that changes how development feels over time.

Every pure function you write becomes a permanent, reliable component.
It does not degrade. It does not acquire hidden state over time.
It does not become more dangerous to call as the system grows.

```
Month 1:   10 pure functions.  You understand all 10.
Month 6:   80 pure functions.  You understand all 80.
Month 12: 300 pure functions.  You understand all 300.
Month 24: 800 pure functions.  You understand all 800.
```

Each new function adds capability without adding cognitive debt.
You are not accumulating a wall — you are accumulating a parts library.

The wall-building developer, at month 24, has a system with 800 interdependent pieces
and understands perhaps 200 of them.
The rest are too dangerous to touch.

The pipeline developer, at month 24, has 800 components that are each as understandable
as the day they were written.

This is not a small difference. This is the entire difference between software
that gets easier to work with over time and software that slowly becomes unmaintainable.

---

## Why YouTube cannot be rewritten

YouTube's codebase is one of the most cited examples of a system that cannot be refactored.
Not because the engineers were incompetent — many of the best engineers in the world
have worked on it. But because it was built in layers, each layer depending on
the specific behaviour of the layer below it.

The patches are load-bearing.
The filler is structural.
The workarounds have workarounds.

To change anything significant, you would need to understand the full dependency graph
of every component that might be affected.
That graph is not documented. It is not knowable.
It exists only in the aggregate behaviour of the running system.

This is not a YouTube problem. It is a structural problem.
Any sufficiently large system built without component isolation eventually reaches this state.

The question is not whether it will happen — it is how long it takes.

---

## The three properties that prevent walls from forming

flow-arch is built on three properties that correspond directly to aerospace engineering principles.

**1. Independent testability (unit verification)**

Every pure function can be verified in isolation.
You do not need the full system running to know if a component is correct.

```javascript
// Each component verified independently — before it ever touches other components
expect(validateOrder({ items: [], total: 0 })).toEqual({ ok: false, error: 'empty order' });
expect(calculateSubtotal({ items: [{ price: 10 }, { price: 20 }] })).toEqual({ subtotal: 30 });
expect(applyDiscount(0.1)({ subtotal: 100 })).toEqual({ subtotal: 90, discountApplied: 10 });
```

**2. Predictable composition (system integration)**

When you combine components that are each individually verified,
the combination is predictable.
There is no emergent behaviour from shared state interactions.
The system does what the components say it does.

**3. Replaceable components (lossless iteration)**

When a component needs to change — new business rule, performance optimisation,
bug fix — you replace it. The components around it do not change.

```javascript
// Before: simple discount calculation
const applyDiscount = (rate) => (order) =>
  ({ ...order, subtotal: order.subtotal * (1 - rate) });

// After: tiered discount — more complex logic, same interface
const applyDiscount = (rate) => (order) => {
  const tier = order.subtotal > 1000 ? rate * 1.5 : rate;
  return { ...order, subtotal: order.subtotal * (1 - tier), discountTier: tier };
};

// Everything that calls applyDiscount still works — same input, same output shape
// Nothing around it changed
// No patches needed
```

---

## The honest cost

Building with this discipline is slower at the start.

Writing a pure function that takes all its dependencies as parameters,
returns a new value instead of modifying its input,
and expresses one single transformation —
takes more thought than writing a function that just does the thing.

The return on that investment comes when:

- You need to add a new feature to a six-month-old pipeline
- A bug is reported and you need to find it in five minutes
- A new developer joins and needs to understand the system in a week
- A requirement changes and you need to replace one component without touching the others

At each of those moments, the developer who built walls spends hours navigating patches.
The developer who built a parts library spends minutes locating the relevant component.

The difference compounds. Every time.

---

## The shift in what you think about

Here is the practical difference in day-to-day experience.

**The wall-builder thinks about:**
- Which class should own this method?
- What is the right name for this variable?
- Why is this test failing when I didn't change this file?
- What will break if I change this?

**The pipeline builder thinks about:**
- What is the input type of this transformation?
- What is the output type?
- Is this function doing one thing?
- Where in the pipeline does this belong?

The wall-builder's cognitive budget is spent **fighting the system**.
The pipeline builder's cognitive budget is spent **improving the system**.

Over time, the gap between them does not close.
It widens.

Not because one is more talented.
Because one has a model that scales, and one does not.

---

*Great software is not written. It is assembled.*
*From components that are individually trustworthy,*
*interfaces that are honest about what they accept and return,*
*and pipelines that make the flow of data visible to anyone who reads them.*

*The wall or the rocket — the choice is made at the level of habit,*
*long before the codebase is large enough for the difference to be obvious.*

*By the time it is obvious, it is usually too late to change.*

---

*This article is part of the thinking behind [flow-arch](https://flow-arch-dev.github.io/flow-arch) —
an open-source exploration of declarative, pure-function architecture across the full stack.
Experimental. Honest about its limitations. Open to disagreement.*
