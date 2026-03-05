# Tutorial 04 — Declarative Patterns for the Hard Cases: Streams, Polling, and Traversal

> **flow-arch / flow-starter**
> Tutorial-03 showed you that `.map()` is eager and how to fix it.
> This tutorial covers the three scenarios where `while` feels unavoidable —
> and shows exactly how to handle each one declaratively.
> These are the boundary cases. They are harder. They are worth understanding precisely.

---

## Why these three cases are different

In tutorial-01, you learned that `while` belongs at the boundary layer —
infrastructure loops, not transformation logic.

But "put it at the boundary" is not a complete answer.
The complete answer is: **how do you wrap it so the boundary is clean?**

The three cases below each represent a different kind of temporal problem:

| Case | The `while` problem | Declarative approach |
|---|---|---|
| Stream reading | You don't know when the data ends | `for await...of` / pipeline |
| Polling | You don't know when a condition becomes true | Promise + event |
| Linked list / tree | You don't know the depth until you walk it | Recursion / flatten first |

Each one requires a different wrapping strategy.

---

## Part 1 — Stream reading

### The `while` version

```javascript
// while version — imperative stream reading
let line;
while ((line = readLine()) !== null) {
  process(line);
}
```

Your brain must track:
- the mutable `line` variable
- the assignment-inside-condition pattern `(line = readLine())`
- the null sentinel value as the termination signal
- whether `process` has side effects that affect the loop

This is four things to hold simultaneously for what is conceptually one thing:
*for each line that exists, process it*.

---

### Fix 1 — `for await...of` (the right default)

```javascript
// for await...of — reads like the intent
for await (const line of readLines()) {
  process(line);
}
```

`readLines()` returns an `AsyncIterable` — an object that knows how to produce values
one at a time, and signals when it is done.

Your brain now tracks: *for each line, process it*. One thought.

The termination logic is **encapsulated inside the AsyncIterable** —
the reader does not need to know or care about null sentinels, socket states, or buffer management.

This is the correct default for stream reading in Node.js.
No library required. No abstraction overhead. Just the intent.

```javascript
// How to make a file readable as AsyncIterable
const readLines = async function*(filePath) {
  const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: fileStream });

  for await (const line of rl) {
    yield line;           // yield one line at a time — lazy, never loads the whole file
  }
  // cleanup happens automatically when the generator finishes or is abandoned
};

// Usage — clean, declarative, no null checks
for await (const line of readLines('data.txt')) {
  await process(line);
}
```

**What you get:**
- No null sentinel to check
- No mutable loop variable
- Automatic cleanup on completion or error
- Lazy — lines are read one at a time, never the whole file in memory

---

### Fix 2 — `pipeline` for composable stream transformation

When you need to **transform** a stream rather than just iterate it,
`pipeline` is the flow-arch equivalent of `.filter().map()` — but for streams.

```javascript
import { pipeline }   from 'stream/promises';
import { createReadStream, createWriteStream } from 'fs';
import { createInterface } from 'readline';
import { Transform } from 'stream';

// Pure transformation functions
const isValidLine   = (line) => line.trim().length > 0;
const parseLine     = (line) => JSON.parse(line);
const formatOutput  = (obj)  => JSON.stringify(obj) + '\n';

// Transform stream — wraps pure functions in the stream protocol
const makeTransform = (fn) => new Transform({
  objectMode: true,
  transform(chunk, _encoding, callback) {
    try {
      const result = fn(chunk);
      if (result !== null && result !== undefined) this.push(result);
      callback();
    } catch (err) {
      callback(err);
    }
  }
});

// Pipeline — declarative composition of stream stages
await pipeline(
  createReadStream('input.jsonl'),
  makeTransform(line => isValidLine(line) ? line : null),
  makeTransform(parseLine),
  makeTransform(formatOutput),
  createWriteStream('output.jsonl')
);

// Reads left to right — same mental model as .filter().map()
// Each stage is a pure function wrapped in the stream protocol
// Memory: O(1) — only one chunk exists at a time
```

**Tracing what happens:**

```
createReadStream reads one chunk
  → makeTransform(isValidLine) receives it
    → if empty line: drops it (returns null)
    → if valid: passes it forward
  → makeTransform(parseLine) receives the string
    → returns a parsed object
  → makeTransform(formatOutput) receives the object
    → returns a formatted string
  → createWriteStream writes it to disk

At no point does the full file exist in memory.
Each stage processes one chunk, passes it forward, forgets it.
```

---

### Fix 3 — AsyncGenerator pipeline (no library required)

For cases where the stream API feels heavy, AsyncGenerators compose naturally:

```javascript
// Lazy filter for async iterables
async function* asyncFilter(iterable, predicate) {
  for await (const item of iterable) {
    if (predicate(item)) yield item;
  }
}

// Lazy map for async iterables
async function* asyncMap(iterable, fn) {
  for await (const item of iterable) {
    yield fn(item);
  }
}

// Lazy take — stops after n items
async function* asyncTake(iterable, n) {
  let count = 0;
  for await (const item of iterable) {
    if (count >= n) return;
    yield item;
    count++;
  }
}

// Compose the pipeline — nothing runs until you consume it
const pipeline = asyncTake(
  asyncMap(
    asyncFilter(readLines('data.txt'), isValidLine),
    parseLine
  ),
  100  // only process first 100 valid lines
);

// Consume — triggers the pipeline
for await (const item of pipeline) {
  await saveToDatabase(item);
}
```

**Tracing the execution:**

```
saveToDatabase requests item 1:
  asyncTake requests from asyncMap
    asyncMap requests from asyncFilter
      asyncFilter requests from readLines → yields line 1
      isValidLine(line 1) → true → passes forward
    asyncMap applies parseLine(line 1) → yields parsed object
  asyncTake count = 1, yields object
saveToDatabase receives item 1, saves it

saveToDatabase requests item 2:
  ... same chain, pulls line 2 ...

After 100 valid items:
  asyncTake returns — pipeline stops
  readLines generator is abandoned — file handle closed automatically
```

The `while` loop is still there — inside `readLines`. But it is **contained**.
The caller sees only: a sequence of values that flows until it doesn't.

---

## Part 2 — Polling

### The `while` version

```javascript
// while version — blocks the thread, CPU spins
while (!server.isReady()) {
  wait(100);
}
```

Problems:
- Blocks synchronously — nothing else can run
- CPU spins even when nothing is changing
- The caller sees raw mechanism, not intent
- No timeout — can wait forever

---

### Fix 1 — Promise wrapping (hide the loop)

The key insight: **the caller should not know that polling is happening**.
The caller should declare *what they are waiting for*, not *how to wait for it*.

```javascript
// The polling mechanism — contained inside a Promise
const waitUntil = (condition, options = {}) => {
  const { interval = 100, timeout = 10_000 } = options;

  return new Promise((resolve, reject) => {
    const start = Date.now();

    const check = () => {
      if (condition()) {
        resolve();                    // condition met — done
        return;
      }

      if (Date.now() - start > timeout) {
        reject(new Error(`Timed out waiting after ${timeout}ms`));
        return;
      }

      setTimeout(check, interval);   // schedule next check — non-blocking
    };

    check();  // first check immediately
  });
};

// Caller — declares intent, sees nothing about polling
await waitUntil(() => server.isReady(), { timeout: 5_000 });
// Either resolves (server is ready) or rejects (timed out)
```

**Tracing the execution:**

```
waitUntil called — returns a Promise immediately (non-blocking)
  check() runs immediately:
    server.isReady() → false
    Date.now() - start = 0 < 5000 → not timed out
    setTimeout(check, 100) → scheduled, returns immediately

100ms later, check() runs again:
  server.isReady() → false → schedule again

... repeat until ...

server.isReady() → true → resolve()
await resumes — caller continues
```

The `while` is gone. The polling is still happening — inside `setTimeout` recursion.
But the caller sees only a Promise. The mechanism is invisible.

---

### Fix 2 — Events (the most declarative approach)

If the resource emits events, polling should not exist at all:

```javascript
// ❌ Polling when events are available
while (!server.isReady()) {
  await sleep(100);
}

// ✅ Event-driven — zero CPU usage while waiting
await new Promise((resolve, reject) => {
  server.once('ready', resolve);
  server.once('error', reject);
});

// Or even cleaner — wrap once for reuse
const waitForEvent = (emitter, successEvent, errorEvent = 'error') =>
  new Promise((resolve, reject) => {
    emitter.once(successEvent, resolve);
    emitter.once(errorEvent, reject);
  });

await waitForEvent(server, 'ready');
```

**Why events beat polling:**

```
Polling:  setTimeout fires every 100ms regardless of whether anything changed
          CPU wakes up 10 times per second to check a condition
          Resource is held in a waiting state

Events:   nothing runs until something actually changes
          CPU is completely idle while waiting
          OS notifies your code exactly when the state changes
```

Use events when available. Use polling only when the resource gives you no choice —
and when you do poll, wrap it so the caller cannot see it.

---

### Fix 3 — Polling as an AsyncGenerator (composable)

When you need to poll and **process each intermediate state**:

```javascript
// Poll as a lazy sequence of states
async function* pollUntil(condition, getValue, options = {}) {
  const { interval = 100, timeout = 10_000 } = options;
  const start = Date.now();

  while (true) {
    const value = getValue();

    if (condition(value)) {
      yield value;
      return;               // final value — done
    }

    if (Date.now() - start > timeout) {
      throw new Error('Polling timed out');
    }

    yield value;            // intermediate state — yield for observation
    await sleep(interval);
  }
}

// Usage — observe intermediate states while waiting
for await (const status of pollUntil(
  (s) => s.ready,
  () => server.getStatus(),
  { interval: 500 }
)) {
  updateProgressBar(status.progress);  // show progress while waiting
}
// Loop ends when status.ready === true
```

---

## Part 3 — Linked list and tree traversal

### The `while` version (linked list)

```javascript
// while version — manual pointer walking
let node = head;
while (node !== null) {
  visit(node);
  node = node.next;
}
```

Problems:
- Mutable `node` pointer — must track its current value at all times
- `visit` is a side effect — what does it do?
- Returns nothing — result accumulates implicitly somewhere
- Difficult to compose with other transformations

---

### Fix 1 — Recursion (pure, returns a value)

```javascript
// ✅ Recursive linked list traversal — pure, returns array
const toArray = (node) =>
  node === null
    ? []
    : [node.value, ...toArray(node.next)];

// Trace with: head = { value: 1, next: { value: 2, next: { value: 3, next: null } } }
// toArray({ value:1, next:... })
//   = [1, ...toArray({ value:2, next:... })]
//   = [1, ...[ 2, ...toArray({ value:3, next:null }) ]]
//   = [1, ...[2, ...[3, ...toArray(null)]]]
//   = [1, ...[2, ...[3, ...[]]]]
//   = [1, 2, 3]

// Now apply declarative pipeline on the result
const result = toArray(head)
  .filter(isValid)
  .map(transform)
  .reduce(accumulate, initial);
```

The key move: **convert the structure to an array first**, then apply the standard declarative pipeline.
You pay for one conversion pass — O(n) — but gain full composability from that point forward.

---

### Fix 2 — Recursive tree traversal

Trees are where recursion is not just cleaner than `while` — it is the natural model:

```javascript
// Binary tree node: { value, left, right }

// ✅ In-order traversal — pure, returns sorted array
const inOrder = (node) =>
  node === null
    ? []
    : [...inOrder(node.left), node.value, ...inOrder(node.right)];

// Trace with:
//       4
//      / \
//     2   6
//    / \ / \
//   1  3 5  7

// inOrder(4)
//   = [...inOrder(2), 4, ...inOrder(6)]
//   = [...[...inOrder(1), 2, ...inOrder(3)], 4, ...inOrder(6)]
//   = [...[...[], 1, ...[], 2, ...[], 3, ...[]], 4, ...similar]
//   = [1, 2, 3, 4, 5, 6, 7]

// Now apply declarative pipeline
const result = inOrder(root)
  .filter(x => x > 3)    // [4, 5, 6, 7]
  .map(x => x * 2);      // [8, 10, 12, 14]
```

---

### Fix 3 — Generator traversal (lazy, no stack overflow)

This is the important one. Recursion has a problem in JavaScript:

```javascript
// ❌ Deep recursion causes stack overflow in JavaScript
const toArray = (node) =>
  node === null ? [] : [node.value, ...toArray(node.next)];

const head = buildLinkedList(100_000);  // 100k nodes
toArray(head);  // RangeError: Maximum call stack size exceeded
```

JavaScript does not have **tail call optimisation (TCO)**.
Every recursive call adds a frame to the call stack.
Deep structures overflow the stack.

**The fix: Generator with explicit stack**

```javascript
// ✅ Generator tree traversal — O(depth) stack, not O(nodes) call stack
function* traverseTree(root) {
  if (root === null) return;

  const stack = [root];     // explicit stack — lives in heap, not call stack

  while (stack.length > 0) {
    const node = stack.pop();
    yield node.value;                         // one value at a time

    if (node.right) stack.push(node.right);   // push children for later
    if (node.left)  stack.push(node.left);
  }
}

// Usage — lazy, safe for deep trees
const values = [...traverseTree(root)];

// Or process lazily without materialising the full array
for (const value of traverseTree(root)) {
  if (value > threshold) break;  // early exit — safe with generators
}
```

**Why this does not overflow:**

```
Recursive version:
  traverseTree(root)
    calls traverseTree(root.left)
      calls traverseTree(root.left.left)
        ... 100k calls deep ...
  Each call = one stack frame = limited OS stack space
  Result: stack overflow at ~10-15k depth in most JS engines

Generator version:
  Stack frames: 1 (the generator function itself)
  Data stack: array in heap memory — can grow to millions of items
  Result: safe for any depth
```

**Tracing the generator on the example tree:**

```
stack = [4]

pop 4, yield 4
  push right=6, push left=2
stack = [6, 2]

pop 2, yield 2
  push right=3, push left=1
stack = [6, 3, 1]

pop 1, yield 1
  no children
stack = [6, 3]

pop 3, yield 3
  no children
stack = [6]

pop 6, yield 6
  push right=7, push left=5
stack = [7, 5]

... continues ...

Result yielded: 4, 2, 1, 3, 6, 5, 7  (pre-order)
```

The `while` loop is still there — inside the generator.
But it is **contained**. The caller sees only a sequence of values.

---

## The wrapping principle — the complete picture

All three cases follow the same pattern:

```
1. The while loop EXISTS — it cannot be eliminated
   (streams end when they end, conditions change when they change,
    structures have depth that must be walked)

2. The while loop is CONTAINED — wrapped inside a black box
   (AsyncGenerator, Promise, explicit stack)

3. The caller sees ONLY the declaration
   (for await...of, await waitUntil(), for...of traverseTree())

4. Side effects are EXPLICIT at the call site
   (saving to database, updating UI — visible where they happen)
```

This is the flow-arch boundary layer in practice.
The impure, temporal, stateful mechanics are real — but they live in one place,
clearly labelled, not scattered through the transformation logic.

---

## The JavaScript limitation — honest accounting

There is one limitation that all three declarative approaches share in JavaScript:

```
Recursive solutions:     stack overflow risk at depth ~10-15k
Generator solutions:     safe, but while loop inside is still imperative
for await...of:          reads well, but the AsyncIterable must be written somewhere
Promise polling:         clean to call, but setTimeout chain inside is still a loop
```

This is why flow-arch explores Haskell and Elixir:

- **Haskell**: lazy lists are built-in. An infinite list `[1..]` consumes no memory. `takeWhile`, `filter`, `map` on infinite sequences are native and safe.
- **Elixir**: `Stream` module is lazy by default. `Stream.iterate`, `Stream.resource`, `Stream.take_while` handle all three cases with no explicit loops at any layer.

In JavaScript, we build these abstractions manually.
In those languages, they come for free.
That gap is a real limitation — and it is documented in `limitations.md`.

---

## Summary

| Case | `while` problem | Declarative fix | Stack safe? |
|---|---|---|---|
| Stream reading | Null sentinel, mutable variable | `for await...of`, `pipeline`, AsyncGenerator | ✅ |
| Polling | Blocks thread, CPU spins | Promise wrap, events, polling generator | ✅ |
| Linked list | Mutable pointer, implicit result | Recursion + `toArray`, Generator + explicit stack | ✅ (generator) |
| Tree traversal | Same as linked list | Recursion (shallow), Generator stack (deep) | ✅ (generator) |

> **The flow-arch rule:**
> `while` can exist — but only inside a wrapper.
> The wrapper exposes a declarative interface.
> The caller never sees a loop counter, a null check, or a mutable pointer.

---

## What's next

- [Tutorial 05 — Immutability in practice: spread, freeze, and structural sharing](./tutorial-05.md)
- [Back to Tutorial 03 — Lazy evaluation and flatMap](./tutorial-03.md)
- [See the live demos](../index.html)

---

*flow-arch / flow-starter · tutorial-04*
*This document is part of the flow-arch open exploration project.*
*Contributions welcome — see [CONTRIBUTING.md](../CONTRIBUTING.md)*
