const result = items
  .map((x) => x.values)
  .reduce((a, b) => a.concat(b), [])
  .map((v) => v * factor)
  .reduce((sum, v) => sum + v, 0);

// ❌ 不纯 — factor 来自外部作用域
let factor = 2;
// const result1 = items.map(...).reduce(...).map(v => v * factor)...
// factor 变了，同样的 items 得到不同结果
// 因为在这个代码片段中，factor 是一个外部变量，如果它的值发生改变，那么在 map(v => v * factor) 
// 这一步中使用的 factor 就会是新的值，从而导致最终的结果也会改变。
// 这就是为什么说这个函数不纯，因为它依赖于外部状态（factor 的值），而不是仅仅依赖于输入参数。

// ✅ 纯 — factor 作为参数传入
const sumDoubledValues = (items, factor) =>
  items
    .map((x) => x.values)
    .reduce((a, b) => a.concat(b), [])
    .map((v) => v * factor)
    .reduce((sum, v) => sum + v, 0);
// 现在 sumDoubledValues 是一个纯函数，因为它的输出完全由输入参数 items 和 factor 决定，不依赖于任何外部状态。


// 纯函数：逻辑清晰，易于在 Flow-source 中复用
const calculateFlowItems = (items, factor) => {
  return items
    .map((item) => /* ... */)
    .reduce((acc, curr) => /* ... */, [])
    .map(v => v * factor);
};

// 调用时明确传入所有依赖
const result1 = calculateFlowItems(state.items, state.factor);