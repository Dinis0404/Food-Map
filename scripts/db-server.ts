/**
 * 本地開發資料庫伺服器（PGlite + Postgres wire protocol）
 *
 * 為咗令 Next.js 嘅多個 render worker 共享同一個資料庫實例，
 * 本地用官方 pglite-socket 起 wire-protocol server（好似真 Postgres 咁連），
 * app 經 DATABASE_URL=postgres://localhost:5433/postgres 連過去。
 *
 * 執行：npm run db:server（保持運行，另開 terminal 跑 npm run dev）
 */
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { randomUUID } from "node:crypto";
import { DDL, SEED } from "./ddl";

const PORT = Number(process.env.PGLITE_PORT ?? 5433);

async function main() {
  const db = new PGlite(".pglite");
  console.log("→ 建立資料表（如有需要）…");
  await db.exec(DDL);

  const existing = await db.query<{ n: string }>(
    "SELECT count(*)::text AS n FROM restaurants",
  );
  if (Number(existing.rows[0]?.n ?? "0") === 0) {
    console.log("→ 灌入示範資料…");
    for (const r of SEED) {
      const rid = randomUUID();
      await db.query(
        `INSERT INTO restaurants (id, name, address, lat, lng, cuisine) VALUES ($1, $2, $3, $4, $5, $6)`,
        [rid, r.name, r.address, r.lat, r.lng, r.cuisine],
      );
      for (const v of r.visits) {
        const vid = randomUUID();
        await db.query(
          `INSERT INTO visits (id, restaurant_id, visited_at, overall_rating, comment, total_price, would_return)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [vid, rid, v.visitedAt, v.overallRating, v.comment, v.totalPrice, v.wouldReturn],
        );
        for (const d of v.dishes) {
          await db.query(
            `INSERT INTO dishes (id, visit_id, name, rating, is_recommend, note) VALUES ($1, $2, $3, $4, $5, $6)`,
            [randomUUID(), vid, d.name, d.rating, d.isRecommend, d.note ?? null],
          );
        }
      }
    }
    console.log(`✓ 已灌入 ${SEED.length} 間餐廳示範資料`);
  } else {
    console.log(`✓ 資料庫已有 ${existing.rows[0]?.n} 間餐廳`);
  }

  const server = new PGLiteSocketServer({
    db,
    port: PORT,
    host: "127.0.0.1",
    maxConnections: 20,
  });
  await server.start();
  console.log(`✓ PGlite socket server 運行中：postgres://localhost:${PORT}/postgres`);
  console.log("  （Ctrl+C 停止）");

  process.on("SIGINT", async () => {
    await server.stop();
    await db.close();
    process.exit(0);
  });
}

main().catch((e) => {
  console.error("✗ db:server 启動失敗：", e);
  process.exit(1);
});
