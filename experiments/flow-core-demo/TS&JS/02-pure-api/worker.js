// 纯函数风格的 API 实现

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // 路由处理
    if (url.pathname === "/api/data") {
      return new Response(JSON.stringify({ data: "example" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
};
