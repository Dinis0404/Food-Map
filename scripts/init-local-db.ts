/**
 * 直接初始化 .pglite 資料夾（灌 DDL + 示範資料），唔啟動 server。
 * 一般情況用 npm run db:server 就夠（會自動建表+灌資料）。
 *
 * 執行：npm run db:init
 */
import { PGlite } from "@electric-sql/pglite";
import { randomUUID } from "node:crypto";
import { DDL, SEED } from "./ddl";

async function main() {
  const db = new PGlite(".pglite");
  console.log("→ 建立資料表…");
  await db.exec(DDL);

  const existing = await db.query<{ n: string }>(
    "SELECT count(*)::text AS n FROM restaurants",
  );
  if (Number(existing.rows[0]?.n ?? "0") > 0) {
    console.log(`✓ 資料庫已有 ${existing.rows[0]?.n} 間餐廳，跳過示範資料`);
    await db.close();
    return;
  }

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
  console.log(`✓ 完成：${SEED.length} 間餐廳示範資料已灌入`);
  await db.close();
}

main().catch((e) => {
  console.error("✗ 初始化失敗：", e);
  process.exit(1);
});
