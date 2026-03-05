# Your Brain Is Not the Problem. Your Mental Model Is.

*Why OOP forces you to think recursively — and why that is the real source of complexity.*

---

There is a specific feeling every developer knows.

You open a file. You see a method call. And before you can understand what it does,
you have to answer three questions that have nothing to do with what you actually came here for.

*Where does this method live?*
*What state does it touch?*
*When does it finish — and what happens if it doesn't?*

Three recursive jumps. Before you've read a single line of logic.

This is not a skill problem. This is a **structural problem**.
And it is baked into the way most of us were taught to write software.

---

## The three recursive jumps of imperative OOP

Consider a line like this:

```javascript
for await (const line of this.fileReader.readLines()) {
  await this.processor.process(line);
}
```

A senior developer might write this without hesitation. It is clean by OOP standards.
But look at what your brain is forced to do before it can understand the intent.

### Jump 1 — The location jump: *where is this?*

`this.fileReader` — where does `fileReader` come from?
Injected in the constructor? Inherited from a parent class? Assigned somewhere in a lifecycle hook?

In OOP, every method call begins with a navigation problem.
Your brain must first locate the object in a class hierarchy before it can even begin to understand what the code does.

This is **spatial cognitive load** — the mental effort of building a map before you can start reading.

### Jump 2 — The side-effect jump: *what does this touch?*

`readLines()` — does it modify `this.buffer`? Does it update `this.lineCount`?
Does calling it twice return different results?

In an imperative codebase, you cannot know without reading the implementation.
The method signature tells you nothing about what state it reads or writes.

This is **trust debt** — the invisible cost of not being able to take a function at its word.

### Jump 3 — The temporal jump: *when does this end?*

`for await` — when does the loop terminate?
Is the underlying socket closed after iteration? If `process` throws, are file handles released?
Is there a timeout? Is there a retry?

Asynchronous imperative code adds a third dimension: time.
You are no longer just navigating space (the class hierarchy) and state (what gets mutated).
You are now navigating a timeline.

Three recursive jumps. Before a single unit of business logic has been processed.

---

## The OOP identity problem

The deeper issue is what I call the **identity fog** of object-oriented code.

When you call `this.fileReader.readLines()`, you genuinely do not know:

- Whether `readLines` is a method defined in this class, or inherited three levels up
- Whether it is a thin wrapper around a native API, or a deep integration with a C++ module
- Whether it is stateless, or whether it quietly maintains an internal cursor
- Whether the same call made twice at different times returns the same result

In a pure function world, none of these questions exist.

```javascript
// Pure function — the identity is completely transparent
const readLines = (filePath) => fs.readFileSync(filePath, 'utf8').split('\n');

// You know:
// — It takes a path, returns an array of strings
// — It does not touch anything outside itself (in the pure version)
// — Calling it twice with the same path returns the same result
// — It has no parent class. It has no inheritance chain. It is what it is.
```

The function's identity is its signature. Nothing more is required.

---

## Why encapsulation became the problem it was supposed to solve

OOP's central promise was **encapsulation** — hide the complexity inside objects,
expose only the interface.

This was a genuine insight. In the 1980s, managing global state across a large codebase
without objects was chaotic. Encapsulation was a real improvement.

But encapsulation has a shadow side that its proponents underestimated:

> **When you hide complexity inside an object,
> you do not eliminate it.
> You just move it somewhere the reader cannot see.**

The complexity is still there. It is just invisible now.

```javascript
// The encapsulation looks clean from outside
const result = this.reportGenerator.generate(this.reportConfig);

// But inside the object:
class ReportGenerator {
  generate(config) {
    this._validateConfig(config);        // touches this._errors
    this._fetchData();                   // touches this._cache, makes HTTP call
    this._applyTransformations();        // touches this._pipeline, this._state
    this._formatOutput();                // touches this._formatter, this._locale
    return this._output;                 // returns this._output, set as side effect
  }
}
```

From the outside, it looks like one line. From the inside, it is a cascade of
shared mutable state, implicit ordering, and hidden dependencies.

The encapsulation did not reduce the complexity.
It **deferred** the complexity to the moment you need to change something.

And that moment always comes.

---

## The inheritance tax

OOP's second major tool is **inheritance** — the idea that classes can extend each other,
sharing behaviour through a hierarchy.

The theory is elegant. The practice compounds the identity problem:

```javascript
class BaseProcessor {
  process(data) { /* version 1 */ }
}

class FilteringProcessor extends BaseProcessor {
  process(data) {
    const filtered = this.filter(data); // where is filter() defined?
    return super.process(filtered);     // calls parent — what does that do now?
  }
}

class CachingFilteringProcessor extends FilteringProcessor {
  process(data) {
    if (this._cache.has(data.id)) {     // side effect: reads cache
      return this._cache.get(data.id);
    }
    const result = super.process(data); // calls FilteringProcessor.process
                                        // which calls BaseProcessor.process
                                        // which does... what, exactly?
    this._cache.set(data.id, result);   // side effect: writes cache
    return result;
  }
}
```

To understand what `CachingFilteringProcessor.process` does, you must read three classes.
To change `BaseProcessor.process`, you must understand how every subclass uses it.

The inheritance hierarchy was supposed to reduce duplication.
It succeeded. And in doing so, it distributed understanding across multiple files,
multiple levels, and multiple layers of implicit behaviour.

This is **the inheritance tax** — the cost of understanding that accumulates
as the hierarchy grows.

---

## What λ-calculus programmers figured out

Functional programming did not emerge because academics disliked semicolons.

It emerged from a different answer to the same question OOP was trying to answer:
*how do we manage complexity in large programs?*

OOP's answer: **group related data and behaviour into objects, manage complexity through encapsulation.**

Functional programming's answer: **eliminate the source of complexity — shared mutable state.**

The insight is radical in its simplicity:

> If a function cannot modify external state, it cannot cause surprise.
> If it cannot cause surprise, you do not need to read its implementation to trust it.
> If you do not need to read its implementation to trust it, your three recursive jumps disappear.

```javascript
// Pure function — zero recursive jumps required
const processLine = (line, config) => line.trim().split(config.delimiter);

// You know everything you need to know from the signature:
// — Input: a string and a config object
// — Output: an array of strings
// — Side effects: none
// — External dependencies: none
// — Surprise potential: zero
```

The function is its own documentation. The signature is the contract.
No class hierarchy to navigate. No state to audit. No timeline to simulate.

---

## The pipeline model: reading left to right

The practical consequence of eliminating shared state is that complex logic
becomes a **linear pipeline** rather than a recursive call tree.

```javascript
// OOP recursive call tree — must navigate vertically
this.dataService
  .getItems()                    // where is getItems defined?
  .then(items => this.filter(items))   // which this.filter?
  .then(filtered => this.transformer.transform(filtered))  // what state does transform touch?
  .then(result => this.repository.save(result));           // side effects?

// Pure function pipeline — reads horizontally
const result = await pipe(
  fetchItems,           // pure fetch — returns data, touches nothing
  filterActive,         // pure filter — in: array, out: array
  transformForStorage,  // pure transform — in: array, out: array
  saveToRepository      // impure — side effects contained here, explicitly
)(config);
```

In the second version, your eyes move left to right.
Each step's identity is explicit — it is exactly what its name says it is.
The one impure step (`saveToRepository`) is identifiable by position and name.

You do not need to jump. You read.

---

## The λ-calculus compounding return

Here is what developers who make the shift consistently report:

When a codebase is built from pure, composable functions, each new feature requires less cognitive context to add.

Not because the features are simpler. Because the existing code does not resist being understood.

```javascript
// Adding a new step to an OOP pipeline
// — Which class owns this logic?
// — Does it inherit from something?
// — What private state does it need access to?
// — Will it interfere with the existing state management?

// Adding a new step to a pure function pipeline
const result = await pipe(
  fetchItems,
  filterActive,
  transformForStorage,
  deduplicateByKey,      // ← new step — pure function, zero integration cost
  saveToRepository
)(config);
```

One line. No class to create. No inheritance to navigate. No state to audit.
The new function either works or it doesn't. If it is pure, it cannot break anything else.

This is the **compounding return** of pure function thinking.
The return on each individual function is modest.
The return on a codebase of pure functions — where every function can be trusted at its signature — is substantial.

---

## The honest cost of making the shift

This is not an argument that OOP is always wrong.

For certain domains — GUI frameworks, game engines, plugin systems, stateful protocol implementations — OOP's encapsulation model is genuinely useful.
Objects that manage lifecycle, resources, and identity have a real home in OOP.

The argument is more specific:

> For **data transformation logic** — the layer where you take input, apply rules, and produce output —
> pure functions are a strictly better model than stateful objects.

The cost of making the shift is real:

**You have to unlearn the habit of mutation.** When you need a modified version of something, you return a new version. This feels wasteful until you understand that modern engines optimise for this case.

**You have to make every dependency explicit.** No more reading from `this`. Everything a function needs comes in as a parameter. This feels verbose until you realise it eliminates an entire category of bugs.

**You have to push side effects to the boundary.** Network calls, database writes, DOM mutations — these do not live inside your transformation logic. They live at the edges, in a layer that is explicitly impure and explicitly contained.

The first week is uncomfortable. The second week, you stop worrying about hidden state.
The third week, you start finding OOP codebases difficult to read.

---

## What this looks like in flow-arch

flow-arch is an open-source exploration of these ideas applied to the full stack.

The frontend layer (flow-vanilla) is built on Web Components with Shadow DOM isolation.
State flows in one direction. The view is a pure function of state.
Side effects — DOM writes, event listeners — are contained in the component shell.

The backend layer (flow-core) explores pure data pipelines in TypeScript, and eventually in Haskell and Elixir — languages where purity is enforced by the type system, not just convention.

The core principle across both layers:

```
Input data
  → pure transformation functions
  → pure view / output functions
  → side effects at the boundary only
```

Every function in the transformation layer can be tested in one line.
Every function's dependencies are visible in its signature.
No class hierarchy. No inheritance. No hidden state.

The three recursive jumps — location, side effects, timeline — simply do not exist
in the transformation layer, because there is nothing there to jump to.

---

## The question worth sitting with

Why did it take until the 2010s for functional ideas to reach mainstream application development?

The machines were fast enough in the 1990s. The ideas existed in academia since the 1960s.

The answer, I think, is that **OOP arrived at exactly the right moment** — when software was becoming too complex for procedural C, but not yet complex enough that OOP's hidden costs were clearly visible.

For two decades, OOP was genuinely the best available tool.

Then software got more distributed, more concurrent, more data-intensive.
And the places where OOP breaks down — shared state in concurrent systems,
inheritance hierarchies that resist change, encapsulation that hides bugs
as effectively as it hides implementation — became impossible to ignore.

The shift toward functional, declarative programming is not a fashion cycle.
It is a response to a specific, real problem: that the mental model we inherited
from the hardware era does not scale to the complexity of the systems we now build.

---

*The machine will always think imperatively. That is its job.*

*Your job is to think in transformations.*

*The gap between those two things — the translation from human intent to machine instruction —
is what the entire history of programming languages is about.*

*We are getting better at it. Not because machines got stronger.*
*Because we finally started admitting that our brains have limits,*
*and designing our code around those limits instead of fighting them.*

---

*This article is part of the thinking behind [flow-arch](https://flow-arch-dev.github.io/flow-arch) —
an open-source exploration of declarative, pure-function architecture across the full stack.
The project is experimental. Limitations are documented honestly.
Contributions and disagreements are equally welcome.*
