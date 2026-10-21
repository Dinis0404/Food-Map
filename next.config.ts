import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 呢個 app 所有頁面都係私人、請求時動態數據（登入後先見到），
  // 唔使用 cacheComponents 嘅 prerender/streaming 模型
  cacheComponents: false,
  // PGlite 有 wasm 同 import.meta.url 路徑依賴，唔可以俾 Turbopack 打包
  serverExternalPackages: ["@electric-sql/pglite"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
