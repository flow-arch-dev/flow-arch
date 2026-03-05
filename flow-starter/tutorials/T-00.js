const numbers = [0, 1, 2, 3, 4];

const isEven = (n) => n % 2 === 0;
const double = (n) => n * 2;

const finalResult = numbers.filter(isEven).map(double);

// const numbers = [1, 2, 3, 4];

// 1. Define Pure Functions (The "What")
// const isEven = (n) => n % 2 === 0;
// const double = (n) => n * 2;

// 2. Use Declarative Chaining
// const result = numbers.filter(isEven).map(double);

console.log(isEven); // function
console.log(result); // true
console.log(isEven()); // false
