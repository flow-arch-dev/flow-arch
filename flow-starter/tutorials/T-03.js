const result = items
  .map((x) => x.values)
  .reduce((a, b) => a.concat(b), [])
  .map((v) => v * factor)
  .reduce((sum, v) => sum + v, 0);

const result1 = items
  .map((x) => x.values)
  // Step 1: O(n)
  // Iterates n items, creates an array of n arrays
  // Memory: O(n) array references

  .reduce((a, b) => a.concat(b), [])
  // Step 2: ⚠️  O(N²) — this is the hidden problem
  //
  // concat() creates a BRAND NEW array and copies everything each time:
  //
  // Iteration 1: []          + [v1, v2]  → new array [v1, v2]        (copies 2)
  // Iteration 2: [v1, v2]    + [v3]      → new array [v1, v2, v3]    (copies 3)
  // Iteration 3: [v1,v2,v3]  + [v4, v5] → new array [v1,v2,v3,v4,v5](copies 5)
  //
  // Total copies: 2 + 3 + 5 + ... → grows with N → O(N²)
  // Memory: O(N) final array + O(N) garbage from discarded copies

  .map((v) => v * factor)
  // Step 3: O(N) — one full pass, creates new array
  // Memory: O(N)

  .reduce((sum, v) => sum + v, 0);
// Step 4: O(N) — one full pass, returns a single number
// Memory: O(1)

// ```javascript
// ❌ Original — O(N²) due to concat in reduce
const result2 = items
  .map((x) => x.values)
  .reduce((a, b) => a.concat(b), [])
  .map((v) => v * factor)
  .reduce((sum, v) => sum + v, 0);

// ✅ Fixed — O(N) with flatMap
const result3 = items
  .flatMap((x) => x.values)
  .map((v) => v * factor)
  .reduce((sum, v) => sum + v, 0);
// ```

// What flatMap does internally — one pass, no repeated copying
// Conceptually equivalent to (but engine-optimised):
const flatten = (items) => {
  const result = [];
  for (const item of items) {
    for (const value of item.values) {
      result.push(value); // push is amortized O(1) — no full copy
    }
  }
  return result;
};

const result4 = items
  .flatMap((x) => x.values)
  // Step 1: O(N) — one pass, builds flat array once
  // Memory: O(N) — one array

  .map((v) => v * factor)
  // Step 2: O(N) — one pass
  // Memory: O(N) — one new array

  .reduce((sum, v) => sum + v, 0);
// Step 3: O(N) — one pass, produces one number
// Memory: O(1)

// Total time:  O(N) + O(N) + O(N) = O(N)  ✅
// Total space: O(N) intermediate arrays    (improvement, but still allocates)

// ✅ Efficient, but intent is still slightly buried
const result5 = items
  .flatMap((x) => x.values)
  .map((v) => v * factor)
  .reduce((sum, v) => sum + v, 0);

// ✅✅ Efficient + named intent + all dependencies explicit
const extractValues = (item) => item.values;
const multiply = (factor) => (v) => v * factor; // curried pure function
const sum = (acc, v) => acc + v;

const sumScaledValues = (items, factor) =>
  items.flatMap(extractValues).map(multiply(factor)).reduce(sum, 0);

// Usage — explicit, testable, memoizable
const result6 = sumScaledValues(state.items, state.factor);

expect(extractValues({ values: [1, 2, 3] })).toEqual([1, 2, 3]);
expect(multiply(2)(5)).toBe(10);
expect(sum(10, 5)).toBe(15);
expect(sumScaledValues([{ values: [1, 2] }, { values: [3] }], 2)).toBe(12);

// Lazy flatMap — yields one value at a time, never builds a full array
function* lazyFlatMap(iterable, fn) {
  for (const item of iterable) {
    yield* fn(item); // yield* delegates — spreads the inner iterable lazily
  }
}

// Lazy map — transforms one value at a time
function* lazyMap(iterable, fn) {
  for (const value of iterable) {
    yield fn(value);
  }
}

// Reduce must be eager — it inherently needs all values to produce a result
const lazyReduce = (iterable, fn, initial) => {
  let acc = initial;
  for (const value of iterable) {
    acc = fn(acc, value);
  }
  return acc;
};

const sumScaledValuesLazy = (items, factor) => {
  const flat = lazyFlatMap(items, extractValues); // no work done yet
  const scaled = lazyMap(flat, multiply(factor)); // no work done yet
  return lazyReduce(scaled, sum, 0); // work happens HERE
  // values flow through the pipeline one at a time
  // no intermediate array is ever fully materialised in memory
};

// Setup: 1000 items × 1000 values = 1,000,000 total values
const items = Array.from({ length: 1000 }, (_, i) => ({
  values: Array.from({ length: 1000 }, (_, j) => i * 1000 + j),
}));
const factor = 2;

// ✅ flatMap — normal application data
const result7 = items
  .flatMap(extractValues)
  .map(multiply(factor))
  .reduce(sum, 0);
// Use when: data fits comfortably in memory, readability is the priority

// ✅ lazy Generator — large or streaming data
const result8 = sumScaledValuesLazy(hugeItems, factor);
// Use when: data is large, memory is constrained, or you need early exit

// ✅ for loop — when lazy adds complexity without benefit
let total = 0;
for (const item of items) {
  for (const value of item.values) {
    total += value * factor;
  }
}
// Use when: the data structure is deeply nested or access patterns are irregular

// ❌ This pattern — always O(N²)
array.reduce((acc, item) => acc.concat(item.values), []);

// ✅ This pattern — always O(N)
array.flatMap((item) => item.values);
