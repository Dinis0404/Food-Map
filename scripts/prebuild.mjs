/**
 * Vercel build 前自動同步資料庫 schema（只在 Neon 環境執行）。
 * 本地（PGlite socket server）跳過——用 npm run db:server 自動建表。
 */
const url = process.env.DATABASE_URL ?? "";

if (!url.includes("neon.tech")) {
  console.log("[prebuild] 非 Neon 環境，跳過 db push");
  process.exit(0);
}

console.log("[prebuild] 同步 schema 去 Neon…");
const { spawnSync } = await import("node:child_process");
const result = spawnSync("npx", ["drizzle-kit", "push", "--force"], {
  stdio: "inherit",
  shell: true,
});
if (result.status !== 0) {
  console.error("[prebuild] drizzle-kit push 失敗");
  process.exit(result.status ?? 1);
}
console.log("[prebuild] schema 已同步 ✓");
