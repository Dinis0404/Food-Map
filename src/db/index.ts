import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePgJs } from "drizzle-orm/postgres-js";
import { neon } from "@neondatabase/serverless";
import postgres from "postgres";
import * as schema from "./schema";

export type DB = ReturnType<typeof drizzleNeon<typeof schema>>;

function createDb(): DB {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "未設定 DATABASE_URL。本地開發：請先執行 `npm run db:server`，並在 .env.local 設定 DATABASE_URL=postgres://localhost:5433/postgres",
    );
  }
  // Neon（Vercel 生產環境）：走 HTTP serverless driver
  if (url.includes("neon.tech")) {
    return drizzleNeon(neon(url), { schema });
  }
  // 其他 Postgres 連線（本地 PGlite socket server / Supabase 等）
  return drizzlePgJs(postgres(url), { schema }) as unknown as DB;
}

export const db = createDb();
export { schema };
