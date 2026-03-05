const users = [
  { id: 1, name: "Austin", score: 90, active: true, tags: ["js", "css"] },
  { id: 2, name: "Bob", score: 45, active: false, tags: ["python"] },
  { id: 3, name: "Carol", score: 78, active: true, tags: ["js", "haskell"] },
  { id: 4, name: "Dana", score: 55, active: true, tags: ["css", "elixir"] },
];

for (initialiser; condition; update) {
  body;
}

for (let i = 0; i < users.length; i++) {
  console.log(users[i].name);
}

// ❌ for loop
const names = [];
for (let i = 0; i < users.length; i++) {
  names.push(users[i].name);
}
// names = ["Austin", "Bob", "Carol", "Dana"]

// ✅ flow-arch
const names1 = users.map((u) => u.name);
// ["Austin", "Bob", "Carol", "Dana"]

// Trace — what map does:
// u = users[0] → u.name = "Austin"  → collected
// u = users[1] → u.name = "Bob"     → collected
// u = users[2] → u.name = "Carol"   → collected
// u = users[3] → u.name = "Dana"    → collected
// Result: ["Austin", "Bob", "Carol", "Dana"]

// ❌ for loop
const active = [];
for (let i = 0; i < users.length; i++) {
  if (users[i].active) {
    active.push(users[i]);
  }
}

const active1 = users.filter((u) => u.active);

// Trace:
// u = Austin (active:true)  → kept
// u = Bob    (active:false) → dropped
// u = Carol  (active:true)  → kept
// u = Dana   (active:true)  → kept
// Result: [Austin, Carol, Dana]

const activeNames = [];
for (let i = 0; i < users.length; i++) {
  if (users[i].active) {
    activeNames.push(users[i].name.toUpperCase());
  }
}

// ✅ flow-arch — each step is a separate, named concern
const toUpperName = (u) => u.name.toUpperCase();
const isActive = (u) => u.active;

const activeNames1 = users.filter(isActive).map(toUpperName);
// ["AUSTIN", "CAROL", "DANA"]

// ❌ for loop
let total = 0;
for (let i = 0; i < users.length; i++) {
  total += users[i].score;
}

// ✅ flow-arch
const total1 = users.reduce((acc, u) => acc + u.score, 0);

// Trace:
// acc=0,  u=Austin → 0  + 90 = 90
// acc=90, u=Bob    → 90 + 45 = 135
// acc=135,u=Carol  → 135 + 78 = 213
// acc=213,u=Dana   → 213 + 55 = 268
// Result: 268

// ❌ nested for loop
const allTags = [];
for (let i = 0; i < users.length; i++) {
  for (let j = 0; j < users[i].tags.length; j++) {
    allTags.push(users[i].tags[j]);
  }
}
// Two loop variables, two levels of index access

// ✅ flow-arch
const allTags1 = users.flatMap((u) => u.tags);
// ["js", "css", "python", "js", "haskell", "css", "elixir"]

// Trace:
// u=Austin → yield "js", "css"
// u=Bob    → yield "python"
// u=Carol  → yield "js", "haskell"
// u=Dana   → yield "css", "elixir"

// ❌ for loop
const byId = {};
for (let i = 0; i < users.length; i++) {
  byId[users[i].id] = users[i];
}

// ✅ flow-arch
const byId1 = users.reduce(
  (acc, u) => ({
    ...acc,
    [u.id]: u,
  }),
  {},
);
// { 1: Austin, 2: Bob, 3: Carol, 4: Dana }

// ✅ Keep for when you genuinely need the index for logic
// Example: zip two arrays together
const scores = [90, 45, 78, 55];
const bonuses = [5, 10, 3, 8];

// No clean Array method for this — for is appropriate
const combined = [];
for (let i = 0; i < scores.length; i++) {
  combined.push(scores[i] + bonuses[i]);
}
// [95, 55, 81, 63]

// Or use Array.from which handles the index cleanly:
const combined1 = Array.from(
  { length: scores.length },
  (_, i) => scores[i] + bonuses[i],
);

for (const item of iterable) {
  body;
}

// ❌ index for — manages i, condition, increment
for (let i = 0; i < users.length; i++) {
  console.log(users[i].name);
}

// ✅ for...of — no index, no condition, no increment
for (const user of users) {
  console.log(user.name);
}

// 1. When you need early exit (break)
for (const user of users) {
  if (user.score > 80) {
    console.log(`First high scorer: ${user.name}`);
    break; // stops immediately — cleaner than finding the index
  }
}
// ✅ Better as: users.find(u => u.score > 80)

// 2. Consuming a Generator (lazy pipeline)
function* activeUsers(users) {
  for (const user of users) {
    if (user.active) yield user;
  }
}

for (const user of activeUsers(users)) {
  await saveUser(user); // side effect — appropriate in boundary layer
}

// 3. Async iteration
for await (const line of readLines("file.txt")) {
  await processLine(line);
}
// ✅ This is the correct pattern — no declarative alternative without a library

for (const key in object) {
  body;
}

const user = { id: 1, name: "Austin", score: 90 };

for (const key in user) {
  console.log(key, user[key]);
}
// "id" 1
// "name" "Austin"
// "score" 90

// for...in iterates INHERITED properties too
function User(name) {
  this.name = name;
}
User.prototype.role = "member"; // added to prototype

const u = new User("Austin");

for (const key in u) {
  console.log(key);
}
// "name"   ← own property
// "role"   ← INHERITED — unexpected!

// The guard: always check hasOwnProperty
for (const key in u) {
  if (u.hasOwnProperty(key)) {
    console.log(key);
  }
}
// "name" only
// ✅ Better as: Object.keys(u).forEach(key => console.log(key))

// ❌ for...in — iterates inherited properties, needs hasOwnProperty guard

// ❌ Never use for...in on arrays
const arr = [10, 20, 30];
arr.customMethod = "oops"; // someone added a property to the array

for (const key in arr) {
  console.log(key);
}
// "0"
// "1"
// "2"
// "customMethod"  ← not an index — causes bugs

const user1 = { id: 1, name: "Austin", score: 90 };

// Get all keys
Object.keys(user1);
// ["id", "name", "score"]

// Get all values
Object.values(user1);
// [1, "Austin", 90]

// Get key-value pairs
Object.entries(user1);
// [["id", 1], ["name", "Austin"], ["score", 90]]

// Transform an object's values — pure
const doubled = Object.fromEntries(
  Object.entries(user1).map(([key, val]) => [
    key,
    typeof val === "number" ? val * 2 : val,
  ]),
);
// { id: 2, name: "Austin", score: 180 }
// (name unchanged — not a number)

// Filter an object's keys — pure
const onlyNumbers = Object.fromEntries(
  Object.entries(user1).filter(([_, val]) => typeof val === "number"),
);
// { id: 1, score: 90 }

const result = {};
for (const key in scores) {
  if (scores.hasOwnProperty(key)) {
    result[key] = scores[key] * 2;
  }
}

// ✅ flow-arch version — safe, pure, testable
const doubleScores = (scores) =>
  Object.fromEntries(Object.entries(scores).map(([k, v]) => [k, v * 2]));

expect(doubleScores({ a: 10, b: 20 })).toEqual({ a: 20, b: 40 });
// One line test — pure function

while (condition) {
  body; // runs as long as condition is true
}

let i = 0;
while (i < users.length) {
  console.log(users[i].name);
  i++;
}

// 1. Stream reading — you don't know when it ends
async function* readLines(path) {
  const rl = readline.createInterface({ input: fs.createReadStream(path) });
  for await (const line of rl) yield line;
}
// while is inside the readline interface — contained, not visible to caller

// 2. Retry logic — run until success or limit
const withRetry = async (fn, maxAttempts = 3) => {
  let attempts = 0;
  while (attempts < maxAttempts) {
    try {
      return await fn(); // success — return immediately
    } catch {
      attempts++;
      if (attempts === maxAttempts) throw new Error("Max retries exceeded");
      await sleep(1000 * attempts); // exponential backoff
    }
  }
};
// while is contained inside withRetry — caller sees only a Promise

// 3. Polling — wait for condition
const waitUntil = (condition, interval = 100) =>
  new Promise((resolve) => {
    const check = () => (condition() ? resolve() : setTimeout(check, interval));
    check();
  });
// No while at all — recursive setTimeout is cleaner

// Pattern: while + counter → for...of or recursion
// ❌ while
let i1 = 0;
const results2 = [];
while (i1 < users.length) {
  if (users[i1].active) results.push(users[i1].name);
  i1++;
}

// ✅ flow-arch
const results = users.filter((u) => u.active).map((u) => u.name);

// Pattern: while + unknown termination → Generator
// ❌ while reading unknown-length data
let line;
while ((line = readLine()) !== null) {
  process(line);
}

// ✅ flow-arch — Generator wraps the while
function* lines(source) {
  let line;
  while ((line = source.readLine()) !== null) {
    yield line; // while is contained INSIDE the generator
  }
}
// Caller sees: for (const line of lines(source)) — no while visible

do {
  body; // runs first, THEN checks condition
} while (condition);

// while — may never execute (if condition is false from start)
let i2 = 5;
while (i2 < 3) {
  console.log(i2); // never runs — 5 < 3 is false
}

// do...while — always executes at least once
let j2 = 5;
do {
  console.log(j2); // runs once — prints 5
  j2++;
} while (j2 < 3); // 6 < 3 is false → stops after one run

// Classic use: input validation loop
// Must ask at least once, keep asking until valid
let input;
do {
  input = prompt("Enter a number > 0:");
} while (isNaN(input) || Number(input) <= 0);
// Guarantees at least one prompt
// Rarely needed in flow-arch — often better as recursion or Generator

// ❌ do...while — often better as recursion or Generator

// ❌ do...while for retry with first attempt
let result2;
let attempts = 0;
do {
  result = await fetchData();
  attempts++;
} while (!result2.ok && attempts < 3);

// ✅ flow-arch — recursive promise, caller sees nothing
const fetchWithRetry = async (fn, remaining = 3) => {
  const result = await fn();
  if (result.ok || remaining <= 1) return result;
  return fetchWithRetry(fn, remaining - 1);
};

const result3 = await fetchWithRetry(() => fetchData());

const result4 = [];
for (let i = 0; i < users.length; i++) {
  if (users[i].active && users[i].score > 70) {
    result.push(users[i].name);
  }
}
result.sort((a, b) => {
  const scoreA = users.find((u) => u.name === a).score;
  const scoreB = users.find((u) => u.name === b).score;
  return scoreB - scoreA;
});
// Tracking burden: i, result, sort, nested find inside sort

const result5 = [];
for (const user of users) {
  if (user.active && user.score > 70) {
    result5.push(user.name);
  }
}
result5.sort();
// Better — no index. Still mutable result, sort mutates.

let i3 = 0;
const result6 = [];
while (i3 < users.length) {
  const u = users[i3];
  if (u.active && u.score > 70) result6.push(u.name);
  i3++;
}
result6.sort((a, b) => b.localeCompare(a));
// Hardest to read — most tracking burden

// Named pure functions — each testable in one line
const isActive1 = (u) => u.active;
const isHighScorer = (u) => u.score > 70;
const toName = (u) => u.name;
const byScoreDesc = (a, b) => b.score - a.score;

const result7 = users
  .filter(isActive1) // [Austin(90), Carol(78), Dana(55)]
  .filter(isHighScorer) // [Austin(90), Carol(78)]
  .sort(byScoreDesc) // [Austin(90), Carol(78)]  — already sorted here
  .map(toName); // ["Austin", "Carol"]

// Trace:
// filter(isActive):      Austin✓ Bob✗ Carol✓ Dana✓  → [Austin,Carol,Dana]
// filter(isHighScorer):  Austin(90>70)✓ Carol(78>70)✓ Dana(55>70)✗ → [Austin,Carol]
// sort(byScoreDesc):     90 > 78 → [Austin, Carol]
// map(toName):           ["Austin", "Carol"]
