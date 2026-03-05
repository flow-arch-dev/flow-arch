const arr = [1, 2, 3, 4, 5];

// Each line below executes FULLY and IMMEDIATELY
const doubled = arr.map((x) => x * 2); // runs 5 times → [2, 4, 6, 8, 10]
const filtered = arr.filter((x) => x > 2); // runs 5 times → [3, 4, 5]
const total = arr.reduce((a, b) => a + b); // runs 4 times → 15

// ❌ Eager trap — computes ALL 1 million values, then takes the first
const first = hugeArray
  .map(expensiveTransform) // runs 1,000,000 times
  .filter(isValid)[0]; // runs 1,000,000 times // takes one value from the result

// The map and filter ran 2,000,000 times to produce 1 value you needed

// && — stops at the first falsy value
false && console.log("never runs"); // right side never evaluated
true && console.log("runs"); // right side evaluated

// || — stops at the first truthy value
true || console.log("never runs"); // right side never evaluated
false || console.log("runs"); // right side evaluated

// ?? — stops if left side is not null/undefined
"value" ?? expensiveDefault(); // expensiveDefault never called
null ?? expensiveDefault(); // expensiveDefault called

// Practical example — lazy default computation
const config = userConfig ?? computeExpensiveDefault();
// computeExpensiveDefault() only runs if userConfig is null or undefined

// ❌ Eager — always computes both
const result1 = getFromCache() || computeFromScratch();

// Wait — || IS lazy. This is already correct.
// getFromCache() runs first. If truthy, computeFromScratch() never runs.

// ❌ The eager mistake:
const cached = getFromCache();
const computed = computeFromScratch(); // always runs, even if cached exists
const result2 = cached || computed;

// Only one branch executes
const result3 = condition
  ? expensiveIfTrue() // only runs if condition is true
  : expensiveIfFalse(); // only runs if condition is false

// Practical: lazy initialisation
const handler = isAdmin
  ? buildAdminHandler(permissions, auditLog, sensitiveData)
  : buildGuestHandler(publicConfig);
// Only one handler is constructed, not both

const arr1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// .find() — stops at first match
const found = arr1.find((x) => x > 5);
// Checks: 1 (no), 2 (no), 3 (no), 4 (no), 5 (no), 6 (YES) → stops
// Result: 6
// Iterations: 6 out of 10

// .some() — stops at first true
const hasLarge = arr1.some((x) => x > 8);
// Checks: 1,2,3,4,5,6,7,8,9 (YES) → stops
// Result: true
// Iterations: 9 out of 10

// .every() — stops at first false
const allSmall = arr1.every((x) => x < 5);
// Checks: 1,2,3,4,5 (NO) → stops
// Result: false
// Iterations: 5 out of 10

// ❌ This does NOT have early exit — .map() is eager
const found1 = arr.map(transform).filter(isMatch)[0];
// map runs 10 times, filter runs 10 times, only [0] is used

// ✅ This has early exit
const found2 = arr.find((x) => isMatch(transform(x)));
// Stops as soon as the first match is found

// Syntax: function* (star after function keyword)
function* numberSequence() {
  console.log("About to yield 1");
  yield 1; // pause here, return 1
  console.log("About to yield 2");
  yield 2; // pause here, return 2
  console.log("About to yield 3");
  yield 3; // pause here, return 3
  console.log("Generator done");
} // return { value: undefined, done: true }

const gen = numberSequence();
// OUTPUT: (nothing — the function body has not started yet)

console.log(gen.next());
// OUTPUT: "About to yield 1"
// OUTPUT: { value: 1, done: false }

console.log(gen.next());
// OUTPUT: "About to yield 2"
// OUTPUT: { value: 2, done: false }

// Stop early — never request the third value
// OUTPUT: (nothing — "About to yield 3" never prints)

// ✅ Infinite sequence — safe because it's lazy
function* naturals(start = 1) {
  let n = start;
  while (true) {
    // infinite loop — but yields one at a time
    yield n++;
  }
}

// Take only what you need
const gen1 = naturals();
gen1.next().value; // 1
gen1.next().value; // 2
gen1.next().value; // 3
// Can pull as many as you want — or stop whenever

// ❌ The array equivalent would crash immediately
const arr2 = Array.from({ length: Infinity }); // RangeError: Invalid array length

// Lazy map — transforms one value at a time, on demand
function* lazyMap(iterable, fn) {
  for (const item of iterable) {
    yield fn(item); // compute one, pause, wait for next pull
  }
}

// Lazy filter
function* lazyFilter(iterable, predicate) {
  for (const item of iterable) {
    if (predicate(item)) yield item;
  }
}

// Lazy take — stops after n items
function* lazyTake(iterable, n) {
  let count = 0;
  for (const item of iterable) {
    if (count >= n) return; // stop the generator
    yield item;
    count++;
  }
}

// Compose lazy pipeline — nothing runs yet
const pipeline = lazyTake(
  lazyFilter(
    lazyMap(naturals(), (x) => x * x), // squares: 1, 4, 9, 16, 25 ...
    (x) => x % 2 === 0, // even squares only: 4, 16, 36 ...
  ),
  3, // take first 3
);

// Nothing has computed yet. Pull values now:
console.log([...pipeline]);
// Trace:
// naturals yields 1 → squared = 1 → 1 % 2 !== 0 → filtered out
// naturals yields 2 → squared = 4 → 4 % 2 === 0 → yield 4, count=1
// naturals yields 3 → squared = 9 → 9 % 2 !== 0 → filtered out
// naturals yields 4 → squared = 16 → 16 % 2 === 0 → yield 16, count=2
// naturals yields 5 → squared = 25 → 25 % 2 !== 0 → filtered out
// naturals yields 6 → squared = 36 → 36 % 2 === 0 → yield 36, count=3 → STOP
// Result: [4, 16, 36]
// naturals never went past 6, even though it's infinite

function* flatten(arrays) {
  for (const arr of arrays) {
    yield* arr; // delegate — yield every item from arr, then continue
  }
}

const nested = [[1, 2], [3, 4], [5]];
console.log([...flatten(nested)]);
// Trace:
// arr = [1, 2] → yield* [1, 2] → yields 1, then 2
// arr = [3, 4] → yield* [3, 4] → yields 3, then 4
// arr = [5]    → yield* [5]    → yields 5
// Result: [1, 2, 3, 4, 5]

// This is the lazy equivalent of .flatMap()
// But unlike flatMap, it never builds the full array — yields one at a time

// Like Generator, but can await inside
async function* readLines(filePath) {
  const stream = fs.createReadStream(filePath, { encoding: "utf8" });
  const rl = readline.createInterface({ input: stream });

  for await (const line of rl) {
    yield line; // yield one line, pause — file stays open but idle
  }
  // stream closed automatically when generator is done or abandoned
}

// Consume lazily
for await (const line of readLines("huge-file.txt")) {
  await processLine(line);
  // Only one line in memory at a time
  // The next line is not read until processLine completes
}

// Early exit — file is not read past line 10
let count = 0;
for await (const line of readLines("huge-file.txt")) {
  if (count >= 10) break; // generator abandoned — stream closed automatically
  await processLine(line);
  count++;
}

// for...of works with any iterable (arrays, generators, strings, Sets, Maps)
// When used with a generator, it pulls one value at a time — lazy

function* gen() {
  yield 1;
  yield 2;
  yield 3;
}

for (const value of gen()) {
  console.log(value);
  if (value === 2) break; // stops the generator — third value never computed
}
// Output: 1, 2

// for await...of — same but for AsyncIterables
for await (const chunk of asyncStream()) {
  process(chunk);
  // next chunk not fetched until process() completes
}

// ❌ Common misconception
const p = new Promise((resolve) => {
  console.log("executor runs immediately"); // this runs NOW, eagerly
  resolve(42);
});

// ✅ .then() IS lazy — runs only when p resolves
p.then((value) => console.log("runs later:", value));

// The practical lazy pattern: factory function
const makeRequest =
  (
    url, // describe the request
  ) =>
  () =>
    // return a function — nothing runs yet
    fetch(url); // only runs when the returned function is called

const getUsers = makeRequest("/api/users");
// Nothing happened yet

getUsers(); // NOW the fetch runs

// Eager — loads the module immediately when the file is parsed
import { heavyLibrary } from "./heavy-library";

// Lazy — loads the module only when needed
const loadHeavy = async () => {
  const { heavyLibrary } = await import("./heavy-library");
  return heavyLibrary.doSomething();
};

// Practical: load expensive libraries only when the user needs them
button.addEventListener("click", async () => {
  const { chartModule } = await import("./chart-module");
  chartModule.render(data);
  // The chart library is not downloaded until the user clicks
});

// Not strictly lazy evaluation, but lazy memory retention
// Object can be garbage-collected even if WeakRef holds a reference

const cache = new Map();

const getOrCompute = (key, expensiveComputation) => {
  const ref = cache.get(key);
  const cached = ref?.deref(); // deref — get value if still in memory

  if (cached !== undefined) return cached;

  const value = expensiveComputation();
  cache.set(key, new WeakRef(value)); // GC can reclaim this if memory is needed
  return value;
};

// ❌ Eager — entire file in memory
const lines = fs.readFileSync("10gb-log.txt", "utf8").split("\n");
const errors = lines.filter((l) => l.includes("ERROR"));
// Memory: 10GB+ crash

// ✅ Lazy — one line at a time
async function* readLines(path) {
  const rl = readline.createInterface({
    input: fs.createReadStream(path),
  });
  for await (const line of rl) yield line;
}

async function* lazyFilter(iter, pred) {
  for await (const item of iter) {
    if (pred(item)) yield item;
  }
}

for await (const error of lazyFilter(readLines("10gb-log.txt"), (l) =>
  l.includes("ERROR"),
)) {
  await saveError(error);
  // Memory: O(1) — one line at a time
}

// Generator that fetches pages lazily
async function* paginatedUsers(pageSize = 20) {
  let page = 0;
  while (true) {
    const users = await fetchUsers({ page, pageSize });
    if (users.length === 0) return; // no more data
    yield* users; // yield each user individually
    page++;
  }
}

// Consumer pulls users as needed — no over-fetching
const userStream = paginatedUsers();

// Show first 20
for (let i = 0; i < 20; i++) {
  const { value: user } = await userStream.next();
  renderUser(user);
}

// User scrolls down — pull 20 more
// Only fetches next page when needed
for (let i = 0; i < 20; i++) {
  const { value: user, done } = await userStream.next();
  if (done) break;
  renderUser(user);
}

// find the first number where an expensive check passes
// ❌ Eager — runs expensive check on all 10,000 items
const result4 = Array.from({ length: 10_000 }, (_, i) => i)
  .map(expensiveCheck) // runs 10,000 times
  .find((x) => x.valid); // find could have stopped at item 3

// ✅ Lazy Generator — stops as soon as found
function* range(n) {
  for (let i = 0; i < n; i++) yield i;
}

function* lazyMap(iter, fn) {
  for (const x of iter) yield fn(x);
}

const result =
  lazyMap(range(10_000), expensiveCheck)
  |> ((gen) => {
    for (const x of gen) if (x.valid) return x;
  });
// expensiveCheck runs only until the first valid result
// If found at item 3: runs 3 times, not 10,000

// WebSocket messages as a lazy async stream
async function* wsMessages(socket) {
  while (true) {
    const message = await nextMessage(socket); // waits until message arrives
    if (message === null) return; // connection closed
    yield message;
  }
}

// Process messages lazily — one at a time, in order
for await (const msg of wsMessages(socket)) {
  await handleMessage(msg);
  // next message not processed until handleMessage completes
  // natural backpressure — no queue overflow
}

// Lazy singleton — only created when first accessed
const createExpensiveService = (() => {
  let instance = null;
  return () => {
    if (!instance) {
      instance = new ExpensiveService(config); // only runs once, only when needed
    }
    return instance;
  };
})();

// Nothing created at module load time
// Created on first call, cached for subsequent calls
const service = createExpensiveService();

// Pure function — stateless transformation
const double = (x) => x * 2;

// Lazy pipeline — describes transformations, executes on demand
const pipeline1 = lazyMap(lazyFilter(dataSource, isValid), double);

// Nothing has run. No side effects possible yet.
// The pipeline is a pure description of what will happen.
// Pull a value → exactly that computation runs, nothing more.

// Eager pipeline — O(N) memory overhead per step
items
  .flatMap(extractValues) // full array in memory
  .map(transform) // another full array in memory
  .filter(isValid) // another full array in memory
  .reduce(accumulate, 0); // finally a single value

// Lazy pipeline — O(1) extra memory
function* process(items) {
  for (const item of items) {
    for (const value of item.values) {
      if (isValid(value)) {
        yield transform(value);
      }
    }
  }
}
reduce(process(items), accumulate, 0);
// One value flows through at a time — no intermediate arrays

// Pure lazy pipeline (transformation layer)
async function* validatedUsers(rawStream) {
  for await (const user of rawStream) {
    const validated = validate(user); // pure
    if (validated.ok) yield validated.value;
  }
}

// Boundary — side effects here, explicitly
async function saveUsers(userStream) {
  for await (const user of validatedUsers(userStream)) {
    await db.save(user); // side effect — contained at the boundary
    logger.info(user.id); // side effect — contained at the boundary
  }
}
