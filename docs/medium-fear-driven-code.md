# The Two Tribes of Programmers Who Don't Know What They're Building

*On fear-driven code, the wheel-reinvention trap, and why your architecture needs a spine.*

---

There is a specific type of codebase that every developer has encountered.

You open it. You start reading. And somewhere around the third function,
you realise you cannot tell what this system is trying to do.

Not because the code is complex.
Because it has no discernible direction.

Functions that query the database, format strings, and throw exceptions —
all in the same breath.
Variables named `temp2`, `resultFinal`, `dataNew`.
A `Utils.js` file with 800 lines and no coherent theme.

This is not incompetence. This is something more specific.

This is what code looks like when it is written from **fear** rather than **intention**.

---

## The two tribes

After enough years reading other people's code, you start to recognise two distinct failure modes.
They look like opposites. They share the same root cause.

### Tribe One: The Wheel Reinventors

These developers write everything from scratch.
Custom HTTP clients. Custom date formatters. Custom state containers.
They distrust every library that is not their own.

Ask them why, and you get answers like:
*"I don't know what that library does internally."*
*"It might modify some global state I'm not aware of."*
*"I can't trust something I didn't write."*

This sounds like rigor. It is actually the opposite.

The reason they cannot trust external libraries is that in their mental model,
**any function might do anything to any state at any time**.

They have worked in codebases where that was true.
So they write their own wheels — and because their mental model is still imperative and stateful,
the new wheels have the same hidden side effects as the ones they feared.

The distrust is justified. The solution makes the problem worse.

### Tribe Two: The Glue Programmers

These developers stack third-party libraries like load-bearing Jenga blocks.
Every problem has a package. Every package has five dependencies.
The `node_modules` folder is the actual application.

When two libraries conflict — and they always do eventually —
the glue programmer writes `if/else` around the seams.
Then another `if/else`. Then a try/catch. Then a flag.
Then a comment that says `// do not touch this`.

The codebase grows. The understanding shrinks.
Each new dependency is an act of faith, not engineering.

The root cause is the same as Tribe One, expressed differently:
**an inability to compose logic that is not already pre-composed by someone else**.

---

## What both tribes are missing

Both failure modes trace back to the same gap:
the absence of a principled model for how data should move through a system.

In λ-calculus terms: no understanding of **composition**.

A pure function has a contract: given this input, it returns this output, and touches nothing else.
When every function in your system has this property, you can combine them freely.
The result of combining two trustworthy functions is a trustworthy function.

This is why functional programmers can use third-party libraries without fear:
if the library exposes pure functions, it cannot surprise you.
It cannot reach into your state. It cannot modify your data.
It does exactly what its signature says.

And this is why they do not need to reinvent every wheel:
because composition gives you a way to **wrap the impure parts** and contain them.

```javascript
// Impure third-party library — does something with side effects
import { externalParser } from 'some-library';

// Wrapper: contain the impurity, expose a pure interface
const parseData = (rawInput) => {
  const result = externalParser(rawInput);  // impure — contained here
  return Object.freeze(result);             // output: immutable, predictable
};

// Now parseData behaves like a pure function to everything above it
// The wheel is borrowed. The contract is yours.
```

You do not need to own the wheel.
You need to own the **contract** that the wheel plugs into.

---

## The chaos pattern: code without a flow direction

The most visible symptom of fear-driven development is what I call
**random walk logic** — code that has no discernible direction.

```javascript
// A real pattern from codebases written without architectural intent
async function handleUserSubmission(req, res) {
  const db = await connectToDatabase();            // infrastructure
  const user = req.body;                           // input
  if (!user.email) return res.status(400).send();  // validation
  const formatted = user.email.toLowerCase();      // transformation
  await db.query(`UPDATE users SET email = ?`, [formatted]); // persistence
  const html = `<p>Updated: ${formatted}</p>`;     // presentation
  logger.info('email updated', { user });          // side effect
  res.send(html);                                  // output
  await sendConfirmationEmail(formatted);          // another side effect
  db.disconnect();                                 // cleanup
}
```

Infrastructure, validation, transformation, persistence, presentation, side effects,
output, more side effects, cleanup — all in one function, in no particular order.

This is not a lazy programmer. This is a programmer who has never been given
a model for where each type of logic belongs.

Every line is locally reasonable. The function, globally, is a maze.

When a bug appears, you cannot isolate it.
When a requirement changes, you cannot locate it.
When a new developer joins, they cannot understand it.

The code works. And it will slowly, quietly, make everything around it worse.

---

## What a spine looks like

The antidote is not more discipline applied to the same mental model.
It is a **different mental model** — one where every line of code has a known position in a flow.

```
Input     →  Validation  →  Transformation  →  Persistence  →  Output
                                                     ↑
                                              Side effects
                                              contained here
```

This is not a new idea. It is the Unix pipe model, applied to application logic.
Each stage receives data, transforms it, passes it forward.
Each stage has one responsibility and one position in the sequence.

```javascript
// The same logic, with a spine

// ── Pure functions — each has one job ──────────────────────────
const validateEmail    = (user) =>
  user.email ? { ok: true, value: user } : { ok: false, error: 'missing email' };

const normaliseEmail   = (user) =>
  ({ ...user, email: user.email.toLowerCase() });

const toUpdateQuery    = (user) =>
  ({ sql: 'UPDATE users SET email = ?', params: [user.email] });

const toConfirmation   = (user) =>
  `<p>Updated: ${user.email}</p>`;

// ── Boundary — side effects contained, explicitly ───────────────
const handleUserSubmission = async (req, res) => {
  const validation = validateEmail(req.body);
  if (!validation.ok) return res.status(400).send(validation.error);

  const user    = normaliseEmail(validation.value);
  const query   = toUpdateQuery(user);

  await db.query(query.sql, query.params);         // side effect — here
  await sendConfirmationEmail(user.email);          // side effect — here
  logger.info('email updated', { user });           // side effect — here

  res.send(toConfirmation(user));
};
```

Now each function has a position. Each function can be tested in one line.
The side effects are visible, grouped, and explicitly last.

When a bug appears, you look at the data at each stage.
You find where it "changes colour" — and that is the bug.

Not because you are smarter. Because the structure makes it visible.

---

## The wrapper principle: owning the contract

One of the most practical consequences of having an architectural spine
is that it changes your relationship with third-party libraries.

Instead of: *"Can I trust this library?"*
The question becomes: *"Can I wrap this library in a contract I trust?"*

```javascript
// Third-party date library — unknown internal state, unclear side effects
import { formatDate } from 'some-date-library';

// ❌ Fear-driven approach: don't use it, rewrite from scratch
const formatDate = (date) => {
  // 60 lines of manual date formatting
  // contains the same bugs as the library you feared
};

// ✅ Spine-driven approach: wrap it, own the contract
const formatDateSafe = (dateString, locale) => {
  if (!dateString) return null;
  const result = formatDate(dateString, { locale });  // third-party call
  return typeof result === 'string' ? result : null;  // our contract: always string or null
};

// Now formatDateSafe is predictable regardless of what the library does internally
// You do not own the wheel. You own the interface.
```

The wrapper is small. The guarantee it provides is large.
Every function downstream can trust `formatDateSafe` without knowing anything about `formatDate`.

This is **the composability that both tribes are missing**.
Not ownership of implementation. Ownership of contracts.

---

## Why complexity grows faster than experience (for most developers)

Here is the pattern that explains most 10-year developers who feel stuck:

```
Year 1:  System has 10 functions.  Developer understands all 10.
Year 3:  System has 100 functions. Developer understands 60.
Year 5:  System has 500 functions. Developer understands 200.
Year 10: System has 2000 functions. Developer understands 400.
```

The system grows. The understanding percentage shrinks.
Each new feature requires modifying state that is entangled with other state.
Each new modification introduces new risk.
The developer spends more time on defensive coding — null checks, fallbacks, retries —
than on the actual logic.

They get slower. Not less skilled. Slower.
Because the system is fighting them.

```
Year 1:  System has 10 pure functions.  Developer understands all 10.
Year 3:  System has 100 pure functions. Developer understands all 100.
Year 5:  System has 500 pure functions. Developer understands all 500.
Year 10: System has 2000 pure functions. Developer understands all 2000.
```

Not because pure functions are magic.
Because **a pure function does not accumulate hidden context over time**.
It is exactly what it was when it was written.
Adding a new pure function does not make any existing function harder to understand.

This is the **compounding return** — the reason λ-calculus practitioners describe feeling
like their ability increases with time, while their imperative colleagues describe feeling
like the codebase is getting away from them.

---

## The "god view" of the pipeline

There is a specific feeling that emerges after building a few systems with a clean data pipeline.

A bug is reported. Data is wrong somewhere.

The imperative developer begins: open the controller, check the service, check the repository,
check the utility, check the middleware, check the global config —
*which of these sixty things mutated the wrong state?*

The pipeline developer begins: look at the data at each stage.

```javascript
// Data enters the pipeline
console.log('after validate:', validate(rawInput));
console.log('after normalise:', normalise(validated));
console.log('after transform:', transform(normalised));
// The data "changes colour" at exactly one point — that is where the bug is
```

Stage 1 looks correct. Stage 2 looks correct. Stage 3 is wrong.
The bug is in the function between Stage 2 and Stage 3.

This is not a clever debugging technique. It is a structural property.
When data flows in one direction through pure transformations,
there is only one place the error can be.

The pipeline developer does not find bugs faster because they are smarter.
They find bugs faster because their architecture makes bugs **locatable**.

---

## The honest admission

The architectural spine is not free.

It requires discipline in the early stages of a project —
resisting the temptation to write one function that does three things
because it is faster right now.

It requires accepting that side effects must be pushed to the boundary,
even when it feels like ceremony.

It requires writing wrappers for third-party code that feels like it should just work as-is.

These are real costs. In a two-week prototype, they may not be worth paying.

The return comes when the system grows. When the team grows.
When the requirements change — and they always change.

At that point, the developer who built a system with a spine
can locate any change, make it in one place, and trust that nothing else broke.

The developer who built a system without a spine
begins the familiar negotiation with their own code:
*touch this carefully. something you cannot see depends on it.*

---

## The question underneath

Why do most developers build without a spine?

Not laziness. Not incompetence.

Because **no one showed them a model for where things belong**.

OOP gave them objects. Procedural programming gave them functions.
Neither gave them a clear answer to: *what is the shape of a well-structured system?*

The answer that functional programming offers is deceptively simple:

> Data enters. Pure functions transform it. Side effects happen at the edge.
> Everything in the middle is predictable. Everything at the edge is explicit.

That is the spine. Not a framework. Not a library. A principle.

Once you have it, you stop asking "where does this code go?"
You know where it goes. It goes in the stage of the pipeline where it belongs.

And when a bug appears, you do not search the codebase.
You follow the data.

---

*Code written from fear accumulates. Code written with intention composes.*

*The difference is not talent.*
*It is whether you have a model for where things belong.*

---

*This article is part of the thinking behind [flow-arch](https://flow-arch-dev.github.io/flow-arch) —
an open-source exploration of declarative, pure-function architecture across the full stack.
The project is experimental. Limitations are documented honestly.
Contributions and disagreements are equally welcome.*
