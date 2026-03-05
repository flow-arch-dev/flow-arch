// 1. The cognitive burden of imperative control flow
const result = [];

for (let i = 0; i < arr.length; i++) {
  if (arr[i] > 10) {
    result.push(arr[i] * 2);
  }
}

// 2. The declarative alternative — same result, less brain work
const result1 = arr.filter((x) => x > 10).map((x) => x * 2);

// 3. The problem with nested conditionals
if (user) {
  if (user.loggedIn) {
    if (user.role === "admin") {
      if (user.permissions.includes("write")) {
        doSomething();
      }
    }
  }
}

// 4. The guard clause alternative — same result, less brain work
if (!user?.loggedIn) return;
if (user.role !== "admin") return;
if (!user.permissions.includes("write")) return;

doSomething();

// 4.The declarative version when conditions are data:
const isAuthorized = (user) =>
  user?.loggedIn && user.role === "admin" && user.permissions.includes("write");

if (isAuthorized(user)) doSomething();

// 5. Why while is the hardest to read
let i = 0;
while (i < items.length) {
  process(items[i]);
  i++;
}

// 6
// Why while is sometimes a legitimate tool
// while is appropriate when:

// Reading from a stream — you genuinely don't know when it ends
while ((line = readLine()) !== null) {
  process(line);
}

// Polling — waiting for a condition to become true
while (!server.isReady()) {
  wait(100);
}

// Recursive-like traversal — processing a linked list or tree
while (node !== null) {
  visit(node);
  node = node.next;
}

// 7. When for is still the right tool
// Declarative — searches the entire array even after finding the answer
const found = items.map(transform).filter(isMatch)[0];

// Imperative — stops as soon as it finds the answer
let found1;
for (const item of items) {
  if (isMatch(transform(item))) {
    found = item;
    break; // exit immediately
  }
}

// Better declarative — .find() has early exit built in
const found2 = items.find((item) => isMatch(transform(item)));
