// Shared dataset for all examples
const users = [
  { id: 1, name: "Austin", score: 90, active: true, tags: ["js", "css"] },
  { id: 2, name: "Bob", score: 45, active: false, tags: ["python"] },
  { id: 3, name: "Carol", score: 78, active: true, tags: ["js", "haskell"] },
  { id: 4, name: "Dana", score: 55, active: true, tags: ["css", "elixir"] },
];



// Form 1 — no curly braces, implicit return
// The expression after => is automatically returned
const double     = (n) => n * 2;
const isActive   = (user) => user.active;
const toName     = (user) => user.name;
const greet      = (name) => `Hello, ${name}`;

// Form 2 — curly braces, explicit return required
const processUser = (user) => {
  const adjusted = user.score * 1.1;    // intermediate variable
  return { ...user, score: adjusted };  // must write return explicitly
};

// Single parameter — parentheses optional
const double1 = n => n * 2;             // same as (n) => n * 2
const double2 = (n) => n * 2;           // same thing

// No parameters — empty parentheses required
const getConfig = () => ({ apiUrl: "https://api.example.com" });

// Returning an object literal — wrap in parentheses
// Without parens, {} is parsed as a function body, not an object
const toSummary = (user) => ({ id: user.id, name: user.name }); // ✅
const toSummary1 = (user) => { id: user.id, name: user.name };   // ❌ syntax error



// No {} → one expression → implicit return → always returns something
const isHigh = (user) => user.score > 80;       // returns true/false
const getName = (user) => user.name;             // returns string

// With {} → can have multiple lines → must write return if you want a value
const adjust = (user) => {
  const bonus = user.active ? 10 : 0;
  return user.score + bonus;                     // explicit return
};
// Without return inside {}, the function returns undefined



const arr = [1, 2, 3];
arr.push(4);
console.log(arr);   // [1, 2, 3, 4]  ← original modified
// push returns the new length: 4



// ❌ flow-arch violation — mutation inside transformation
const addBonus = (users) => {
  const result = [];
  users.forEach(user => result.push({ ...user, score: user.score + 10 }));
  return result;
};

// ✅ flow-arch style — no mutation, no push
const addBonus1 = (users) => users.map(user => ({ ...user, score: user.score + 10 }));


// Boundary layer — building up a result in an imperative loop (contained)
const buildReport = (data) => {
  const lines = [];              // local array — not shared state
  for (const item of data) {
    lines.push(formatLine(item)); // push into local array — acceptable
  }
  return lines;                  // returned as immutable result
};



let i = 0;
console.log(i++);  // 0  ← returns BEFORE incrementing
console.log(i);    // 1

let j = 0;
console.log(++j);  // 1  ← returns AFTER incrementing
console.log(j);    // 1



let count = 0;
const withIndex = users.map(user => ({ ...user, index: count++ }));
// count is external state — makes this function impure

// ✅ Use the index parameter map provides
const withIndex1 = users.map((user, index) => ({ ...user, index }));
// index is a parameter — pure, no external state



// Keep active users
const activeUsers = users.filter(user => user.active);
// [Austin(90), Carol(78), Dana(55)]

// Keep high scorers
const highScorers = users.filter(user => user.score >= 70);
// [Austin(90), Carol(78)]

// Combine conditions
const activeHigh = users.filter(user => user.active && user.score >= 70);
// [Austin(90), Carol(78)]



// Named predicate — even cleaner
const isActive1     = (user) => user.active;
const isHighScorer1 = (user) => user.score >= 70;

const result = users.filter(isActive1).filter(isHighScorer1);
// Each filter step readable and independently testable




// filter is equivalent to:
const filter = (arr, predicate) => {
  const result = [];
  for (const item of arr) {
    if (predicate(item)) result.push(item);
  }
  return result;
};
// But you never write this — use .filter() instead



// Extract names
const names = users.map(user => user.name);
// ["Austin", "Bob", "Carol", "Dana"]

// Transform objects
const withGrade = users.map(user => ({
  ...user,                                          // spread original
  grade: user.score >= 70 ? "pass" : "fail"        // add new property
}));
// [{...Austin, grade:"pass"}, {...Bob, grade:"fail"}, ...]

// Compute new values
const scaled = users.map(user => ({
  ...user,
  score: Math.round(user.score * 1.1)   // scale score by 10%
}));



// map provides (item, index, array) to the callback
const withPosition = users.map((user, index) => ({
  ...user,
  position: index + 1    // 1-based position
}));
// [{...Austin, position:1}, {... Bob, position:2}, ...]



// Only active users, extract their names
const activeNames = users
  .filter(user => user.active)          // [Austin, Carol, Dana]
  .map(user => user.name);             // ["Austin", "Carol", "Dana"]




// Sum all scores
const totalScore = users.reduce((acc, user) => acc + user.score, 0);
// acc starts at 0
// acc = 0 + 90 = 90   (Austin)
// acc = 90 + 45 = 135 (Bob)
// acc = 135 + 78 = 213 (Carol)
// acc = 213 + 55 = 268 (Dana)
// Result: 268

// Build an object from an array (index by id)
const usersById = users.reduce((acc, user) => ({
  ...acc,
  [user.id]: user    // computed property key
}), {});
// { 1: {Austin...}, 2: {Bob...}, 3: {Carol...}, 4: {Dana...} }

// Group by a property
const byStatus = users.reduce((acc, user) => ({
  ...acc,
  [user.active ? "active" : "inactive"]: [
    ...(acc[user.active ? "active" : "inactive"] || []),
    user
  ]
}), {});
// { active: [Austin, Carol, Dana], inactive: [Bob] }



arr.reduce(callback, initialValue)
//         ↑         ↑
//         (acc, currentItem) => newAcc
//                   starts here — always provide this

// Without initialValue:
// acc starts as arr[0], currentItem starts as arr[1]
// Risky — fails on empty arrays
[].reduce((a, b) => a + b);          // TypeError: Reduce of empty array
[].reduce((a, b) => a + b, 0);       // 0 — safe with initial value




// Extract all tags from all users into one flat array
const allTags = users.flatMap(user => user.tags);
// users[0].tags = ["js", "css"]
// users[1].tags = ["python"]
// users[2].tags = ["js", "haskell"]
// users[3].tags = ["css", "elixir"]
// Result: ["js", "css", "python", "js", "haskell", "css", "elixir"]

// Why not map + flat?
const withMap  = users.map(user => user.tags);
// [["js","css"], ["python"], ["js","haskell"], ["css","elixir"]]
const flattened = withMap.flat();
// ["js", "css", "python", "js", "haskell", "css", "elixir"]
// Same result — but flatMap does it in one O(N) pass



// ❌ O(N²) — concat copies the array on every iteration
users.map(u => u.tags).reduce((a, b) => a.concat(b), []);

// ✅ O(N) — flatMap builds the array once
users.flatMap(u => u.tags);




// flatMap can conditionally include or exclude items
// Return empty array [] to exclude, [value] to include
const activeNames1 = users.flatMap(user =>
  user.active ? [user.name] : []   // only include active users' names
);
// ["Austin", "Carol", "Dana"]

// This is sometimes cleaner than filter + map for conditional transforms



const a = [1, 2, 3];
const b = [4, 5, 6];

const merged = a.concat(b);     // [1, 2, 3, 4, 5, 6]
console.log(a);                 // [1, 2, 3] — unchanged
console.log(b);                 // [4, 5, 6] — unchanged

// Concat multiple
const all = a.concat(b, [7, 8]);  // [1, 2, 3, 4, 5, 6, 7, 8]



users.map(u => u.tags).reduce((a, b) => a.concat(b), []); // O(N²)

// ✅ Use flatMap instead
users.flatMap(u => u.tags);   // O(N)

// ✅ concat is fine for one-time merges
const admins  = users.filter(u => u.role === "admin");
const editors = users.filter(u => u.role === "editor");
const privileged = admins.concat(editors);  // one concat — O(N), fine



const names1 = ["Austin", "Carol", "Dana"];

names1.join(', ');    // "Austin, Carol, Dana"
names1.join(' | ');   // "Austin | Carol | Dana"
names1.join('');      // "AustinCarolDana"
names1.join();        // "Austin,Carol,Dana"  — default delimiter is comma

// In view functions — building HTML
const listItems = users
  .filter(u => u.active)
  .map(u => `<li>${u.name}</li>`)
  .join('');         // no separator for HTML elements

// Result: "<li>Austin</li><li>Carol</li><li>Dana</li>"




const firstActive = users.find(u => u.active);
// Checks Austin (active=true) → found immediately → returns Austin
// Bob, Carol, Dana are never checked

const highScorer = users.find(u => u.score >= 80);
// Checks Austin (90 >= 80) → found → returns Austin

const notFound = users.find(u => u.score > 100);
// Checks all 4 → none match → returns undefined




// ❌ Eager — filter scans entire array even after finding the answer
const first1 = users.filter(u => u.active)[0];
// [filter runs 4 times] → [takes index 0]

// ✅ Lazy — find stops at first match
const first = users.find(u => u.active);
// [find runs 1 time] → returns Austin immediately

// find vs filter:
// Use find   when you want ONE item
// Use filter when you want ALL matching items




const tags = ["js", "css", "haskell"];

tags.includes("js");       // true
tags.includes("python");   // false
tags.includes("JS");       // false — case sensitive, strict equality

// Useful in filter predicates
const jsUsers = users.filter(u => u.tags.includes("js"));
// [Austin (has "js"), Carol (has "js")]

// With strings
const name = "Austin";
name.includes("ust");    // true — works on strings too



// Named predicate — pure, testable
const knowsJS = (user) => user.tags.includes("js");

expect(knowsJS({ tags: ["js", "css"] })).toBe(true);    // ✅ one line test
expect(knowsJS({ tags: ["python"] })).toBe(false);       // ✅ one line test

const jsUsers1 = users.filter(knowsJS);




// Basic switch
const getGrade = (score) => {
  switch (true) {
    case score >= 90: return "A";
    case score >= 70: return "B";
    case score >= 50: return "C";
    default:          return "F";
  }
};

getGrade(90);  // "A"
getGrade(75);  // "B"
getGrade(45);  // "F"




// The reducer pattern — switch is the right tool here
const reducer = (state, action) => {
  switch (action.type) {
    case "SET_ACTIVE":
      return {
        ...state,
        users: state.users.map(u =>
          u.id === action.id ? { ...u, active: true } : u
        )
      };

    case "ADD_SCORE":
      return {
        ...state,
        users: state.users.map(u =>
          u.id === action.id ? { ...u, score: u.score + action.amount } : u
        )
      };

    case "RESET":
      return INITIAL_STATE;

    default:
      return state;   // always return state unchanged for unknown actions
  }
};




// Usage
const state1 = reducer(initialState, { type: "ADD_SCORE", id: 1, amount: 5 });
// Austin's score: 90 → 95

const state2 = reducer(state1, { type: "SET_ACTIVE", id: 2 });
// Bob: active false → true




const a1 = [1, 2, 3];
const b1 = [4, 5, 6];

const combined = [...a1, ...b1];        // [1, 2, 3, 4, 5, 6]
const withNew   = [...a1, 7];          // [1, 2, 3, 7]
const copy      = [...a1];             // [1, 2, 3] — shallow copy

// Add to front
const withFirst = [0, ...a1];          // [0, 1, 2, 3]

// Insert at position
const withMiddle = [...a1.slice(0,1), 99, ...a1.slice(1)];
// [1, 99, 2, 3]




const user = { id: 1, name: "Austin", score: 90 };

// Copy
const copy1 = { ...user };             // { id:1, name:"Austin", score:90 }

// Override one property — new object, original unchanged
const updated = { ...user, score: 95 };
// { id:1, name:"Austin", score:95 }
console.log(user.score);             // 90 — unchanged

// Add property
const withGrade1 = { ...user, grade: "A" };
// { id:1, name:"Austin", score:90, grade:"A" }

// Merge objects
const extra = { active: true, tags: ["js"] };
const merged1 = { ...user, ...extra };
// { id:1, name:"Austin", score:90, active:true, tags:["js"] }
// Later spread wins for duplicate keys


// Spread is ONE LEVEL DEEP only
const user1 = { id: 1, address: { city: "Shenzhen" } };
const copy2 = { ...user1 };  // shallow copy — user1.address is the same object as copy1.address

copy2.address.city = "Beijing";    // modifies the ORIGINAL user1.address.city
console.log(user1.address.city);   // "Beijing" — oops

// Fix: spread each level you modify
const safeCopy = {
  ...user1,
  address: { ...user1.address, city: "Beijing" }
};
console.log(user1.address.city);   // "Shenzhen" — original safe


// Rest parameter — collects extra arguments
const sum = (...numbers) => numbers.reduce((a, b) => a + b, 0);

sum(1, 2, 3);       // 6
sum(1, 2, 3, 4, 5); // 15

// First param normal, rest collected
const log = (level, ...messages) => {
  console.log(`[${level}]`, messages.join(' '));
};

log("INFO", "user", "logged", "in");  // [INFO] user logged in



function* scoreSequence(users) {
  for (const user of users) {
    console.log(`  about to yield ${user.name}`);
    yield user.score;   // pause, send score to caller
    console.log(`  resumed after ${user.name}`);
  }
}

const gen = scoreSequence(users);
// OUTPUT: (nothing — function not started)

console.log(gen.next());
// OUTPUT: "  about to yield Austin"
// OUTPUT: { value: 90, done: false }

console.log(gen.next());
// OUTPUT: "  resumed after Austin"
// OUTPUT: "  about to yield Bob"
// OUTPUT: { value: 45, done: false }

// Stop early
// OUTPUT: (Carol and Dana never processed)



// return — ends the function, one value
const getFirst = (users) => users[0].score;  // returns once, done

// yield — pauses, can resume, many values
function* getScores(users) {
  for (const user of users) {
    yield user.score;   // pauses 4 times, resumes 4 times
  }
}




// From iterable (Set, Map, Generator, string)
Array.from(new Set([1, 2, 2, 3]));     // [1, 2, 3] — deduplicated
Array.from("hello");                    // ["h", "e", "l", "l", "o"]

// From {length} with map function — create sequences
Array.from({ length: 5 }, (_, i) => i);          // [0, 1, 2, 3, 4]
Array.from({ length: 5 }, (_, i) => i + 1);      // [1, 2, 3, 4, 5]
Array.from({ length: 4 }, (_, i) => i * 2);      // [0, 2, 4, 6]

// Consume a Generator into an array
function* range(n) {
  for (let i = 0; i < n; i++) yield i;
}
Array.from(range(5));   // [0, 1, 2, 3, 4]
[...range(5)];          // same thing — spread also consumes generators



// Typical use: materialise a lazy pipeline when you need an array
const result2 = Array.from(
  lazyPipeline(largeDataset)   // lazy — processes one at a time
);
// Now result2 is an array — use when downstream needs random access



// Static import — eager, runs at module load time
import { filter, map } from './utils.js';
import { createStore } from './store.js';

// Named imports
import { isActive, toName, toListItem } from './transforms.js';

// Default import
import reducer from './reducer.js';

// Dynamic import — lazy, runs only when called
const loadChart = async () => {
  const { renderChart } = await import('./chart.js');
  renderChart(data);
};
// chart.js is NOT downloaded until loadChart() is called



// flow-arch file structure — each file exports pure functions
// transforms.js
export const isActive2    = (user) => user.active;
export const toName2      = (user) => user.name;
export const toListItem2  = (user) => `<li>${user.name}</li>`;
export const addBonus2    = (amount) => (user) => ({ ...user, score: user.score + amount });

// view.js
import { isActive2, toListItem } from './transforms.js';

export const view = (state) =>
  state.users
    .filter(isActive2)
    .map(toListItem2)
    .join('');



    // Basic assertions
expect(double(4)).toBe(8);                   // strict equality ===
expect(isActive({ active: true })).toBe(true);
expect(users.filter(isActive)).toHaveLength(3);
expect(toName(users[0])).toBe("Austin");

// Array/object equality — deep comparison
expect(users.map(toName)).toEqual(["Austin", "Bob", "Carol", "Dana"]);
expect(addBonus(10)(users[0])).toEqual({ ...users[0], score: 100 });

// Checking for errors
expect(() => parseUser(null)).toThrow();
expect(() => parseUser(null)).toThrow("user cannot be null");



// The one-line test rule for pure functions
// If your test needs more than a few lines, the function is probably impure

const isActive2   = (user) => user.active;
const addBonus2   = (n) => (user) => ({ ...user, score: user.score + n });
const activeOnly2 = (users) => users.filter(isActive2);

// Each tested in isolation, zero setup
expect(isActive2({ active: true })).toBe(true);
expect(isActive2({ active: false })).toBe(false);
expect(addBonus2(10)({ score: 80 })).toEqual({ score: 90 });
expect(activeOnly2([{ active: true }, { active: false }])).toHaveLength(1);




const arr1 = [1, 2, 3, 4, 5];

arr1.slice(0, 3);    // [1, 2, 3]  — first 3
arr1.slice(2);       // [3, 4, 5]  — from index 2 to end
arr1.slice(1, 4);    // [2, 3, 4]  — index 1 up to (not including) 4
arr1.slice(-2);      // [4, 5]     — last 2
console.log(arr1);   // [1,2,3,4,5] — original unchanged

// "take first n" pattern
const take = (n) => (arr1) => arr1.slice(0, n);

take(3)(users);  // [Austin, Bob, Carol]





// Stage 3 proposal — not yet standard, works in some environments
// When available:
Iterator.from(users).take(3).toArray();

// Until then, use slice or Generator-based lazyTake
function* lazyTake(iterable, n) {
  let count = 0;
  for (const item of iterable) {
    if (count >= n) return;
    yield item;
    count++;
  }
}