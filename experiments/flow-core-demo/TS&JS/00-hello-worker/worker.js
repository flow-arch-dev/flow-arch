// 最简单的边缘函数示例
export default {
  fetch(request) {
    return new Response("Hello, World!", {
      headers: { "Content-Type": "text/plain" },
    });
  },
};
