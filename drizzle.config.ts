import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// 本地設定在 .env.local（Next.js 慣例）；Vercel 用 process env
config({ path: ".env.local" });
config();

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
