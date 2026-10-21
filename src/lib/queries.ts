import {
  and,
  asc,
  avg,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  max,
} from "drizzle-orm";
import { db } from "@/db";
import { dishes, restaurants, visits } from "@/db/schema";
import type { VisitInput } from "@/lib/validators";

export type DishRow = typeof dishes.$inferSelect;
export type RestaurantRow = typeof restaurants.$inferSelect;

export type VisitWithRelations = {
  id: string;
  visitedAt: string;
  overallRating: number;
  comment: string | null;
  totalPrice: number | null;
  wouldReturn: boolean;
  restaurant: { id: string; name: string; cuisine: string | null; address: string | null };
  dishes: DishRow[];
};

export type VisitListFilters = {
  q?: string;
  from?: string;
  to?: string;
  minRating?: number;
  recommendOnly?: boolean;
  restaurantId?: string;
  sort?: "newest" | "oldest" | "rating";
  limit?: number;
};

async function loadDishesByVisitIds(visitIds: string[]) {
  if (visitIds.length === 0) return new Map<string, DishRow[]>();
  const rows = await db.select().from(dishes).where(inArray(dishes.visitId, visitIds));
  const map = new Map<string, DishRow[]>();
  for (const d of rows) {
    const list = map.get(d.visitId);
    if (list) list.push(d);
    else map.set(d.visitId, [d]);
  }
  return map;
}

export async function listVisits(filters: VisitListFilters = {}): Promise<VisitWithRelations[]> {
  const conds = [];
  if (filters.q) conds.push(ilike(restaurants.name, `%${filters.q}%`));
  if (filters.from) conds.push(gte(visits.visitedAt, filters.from));
  if (filters.to) conds.push(lte(visits.visitedAt, filters.to));
  if (filters.minRating) conds.push(gte(visits.overallRating, filters.minRating));
  if (filters.restaurantId) conds.push(eq(visits.restaurantId, filters.restaurantId));

  const order =
    filters.sort === "rating"
      ? [desc(visits.overallRating), desc(visits.visitedAt)]
      : filters.sort === "oldest"
        ? [asc(visits.visitedAt)]
        : [desc(visits.visitedAt), desc(visits.createdAt)];

  const rows = await db
    .select({
      visit: visits,
      restaurant: {
        id: restaurants.id,
        name: restaurants.name,
        cuisine: restaurants.cuisine,
        address: restaurants.address,
      },
    })
    .from(visits)
    .innerJoin(restaurants, eq(visits.restaurantId, restaurants.id))
    .where(conds.length > 0 ? and(...conds) : undefined)
    .orderBy(...order)
    .limit(filters.limit ?? 300);

  const dishMap = await loadDishesByVisitIds(rows.map((r) => r.visit.id));
  let result: VisitWithRelations[] = rows.map((r) => ({
    id: r.visit.id,
    visitedAt: r.visit.visitedAt,
    overallRating: r.visit.overallRating,
    comment: r.visit.comment,
    totalPrice: r.visit.totalPrice,
    wouldReturn: r.visit.wouldReturn,
    restaurant: r.restaurant,
    dishes: dishMap.get(r.visit.id) ?? [],
  }));

  if (filters.recommendOnly) {
    result = result.filter((v) => v.dishes.some((d) => d.isRecommend));
  }
  return result;
}

export async function getVisitWithRelations(id: string): Promise<VisitWithRelations | null> {
  const rows = await db
    .select({
      visit: visits,
      restaurant: {
        id: restaurants.id,
        name: restaurants.name,
        cuisine: restaurants.cuisine,
        address: restaurants.address,
      },
    })
    .from(visits)
    .innerJoin(restaurants, eq(visits.restaurantId, restaurants.id))
    .where(eq(visits.id, id))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  const dishMap = await loadDishesByVisitIds([id]);
  return {
    id: row.visit.id,
    visitedAt: row.visit.visitedAt,
    overallRating: row.visit.overallRating,
    comment: row.visit.comment,
    totalPrice: row.visit.totalPrice,
    wouldReturn: row.visit.wouldReturn,
    restaurant: row.restaurant,
    dishes: dishMap.get(id) ?? [],
  };
}

export type RestaurantSummary = {
  id: string;
  name: string;
  address: string | null;
  cuisine: string | null;
  lat: number;
  lng: number;
  visitCount: number;
  avgRating: number | null;
  lastVisitedAt: string | null;
};

export async function listRestaurantSummaries(): Promise<RestaurantSummary[]> {
  const rows = await db
    .select({
      id: restaurants.id,
      name: restaurants.name,
      address: restaurants.address,
      cuisine: restaurants.cuisine,
      lat: restaurants.lat,
      lng: restaurants.lng,
      visitCount: count(visits.id),
      avgRating: avg(visits.overallRating),
      lastVisitedAt: max(visits.visitedAt),
    })
    .from(restaurants)
    .leftJoin(visits, eq(visits.restaurantId, restaurants.id))
    .groupBy(restaurants.id)
    .orderBy(desc(max(visits.visitedAt)));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    address: r.address,
    cuisine: r.cuisine,
    lat: r.lat,
    lng: r.lng,
    visitCount: Number(r.visitCount),
    avgRating: r.avgRating === null ? null : Math.round(Number(r.avgRating) * 10) / 10,
    lastVisitedAt: r.lastVisitedAt ?? null,
  }));
}

export type RestaurantDetail = {
  restaurant: RestaurantRow;
  stats: { visitCount: number; avgRating: number | null; lastVisitedAt: string | null };
  visits: VisitWithRelations[];
  /** 菜式彙總：同一道菜跨多次光顧統計 */
  dishSummary: { name: string; times: number; avgRating: number | null; recommendCount: number }[];
};

export async function getRestaurantDetail(id: string): Promise<RestaurantDetail | null> {
  const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, id)).limit(1);
  if (!restaurant) return null;

  const visitsList = await listVisits({ restaurantId: id, sort: "newest" });
  const visitCount = visitsList.length;
  const avgRating =
    visitCount === 0
      ? null
      : Math.round(
          (visitsList.reduce((s, v) => s + v.overallRating, 0) / visitCount) * 10,
        ) / 10;

  const dishMap = new Map<string, { times: number; ratingSum: number; ratingN: number; recommendCount: number }>();
  for (const v of visitsList) {
    for (const d of v.dishes) {
      const key = d.name.trim();
      const entry = dishMap.get(key) ?? { times: 0, ratingSum: 0, ratingN: 0, recommendCount: 0 };
      entry.times += 1;
      if (d.rating != null) {
        entry.ratingSum += d.rating;
        entry.ratingN += 1;
      }
      if (d.isRecommend) entry.recommendCount += 1;
      dishMap.set(key, entry);
    }
  }
  const dishSummary = [...dishMap.entries()]
    .map(([name, e]) => ({
      name,
      times: e.times,
      avgRating: e.ratingN === 0 ? null : Math.round((e.ratingSum / e.ratingN) * 10) / 10,
      recommendCount: e.recommendCount,
    }))
    .sort((a, b) => b.recommendCount - a.recommendCount || b.times - a.times);

  return {
    restaurant,
    stats: {
      visitCount,
      avgRating,
      lastVisitedAt: visitsList[0]?.visitedAt ?? null,
    },
    visits: visitsList,
    dishSummary,
  };
}

/** 依 id / osmId 尋找或建立餐廳；失敗（缺欄位）回 null */
export async function upsertRestaurant(
  input: VisitInput["restaurant"],
): Promise<RestaurantRow | null> {
  if (input.id) {
    const [existing] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, input.id))
      .limit(1);
    return existing ?? null;
  }
  if (!input.name || input.lat === undefined || input.lng === undefined) {
    return null;
  }

  if (input.osmId) {
    const [existing] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.osmId, input.osmId))
      .limit(1);
    if (existing) return existing;
  }

  try {
    const [created] = await db
      .insert(restaurants)
      .values({
        name: input.name,
        address: input.address ?? null,
        lat: input.lat,
        lng: input.lng,
        osmId: input.osmId ?? null,
        cuisine: input.cuisine ?? null,
      })
      .returning();
    return created;
  } catch (e) {
    // 併發下撞唯一索引：當作已存在，重新查一次
    if (input.osmId && String(e).includes("restaurants_osm_id_key")) {
      const [existing] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.osmId, input.osmId))
        .limit(1);
      return existing ?? null;
    }
    throw e;
  }
}

export async function createVisit(input: VisitInput) {
  const restaurant = await upsertRestaurant(input.restaurant);
  if (!restaurant) return null;

  const [visit] = await db
    .insert(visits)
    .values({
      restaurantId: restaurant.id,
      visitedAt: input.visitedAt,
      overallRating: input.overallRating,
      comment: input.comment ?? null,
      totalPrice: input.totalPrice ?? null,
      wouldReturn: input.wouldReturn ?? true,
    })
    .returning();

  if (input.dishes.length > 0) {
    await db.insert(dishes).values(
      input.dishes.map((d) => ({
        visitId: visit.id,
        name: d.name,
        rating: d.rating ?? null,
        isRecommend: d.isRecommend ?? false,
        note: d.note ?? null,
      })),
    );
  }
  return { visit, restaurant };
}

export async function updateVisit(id: string, input: VisitInput) {
  const [existing] = await db.select().from(visits).where(eq(visits.id, id)).limit(1);
  if (!existing) return null;

  // 餐廳有換嘅話先處理
  let restaurantId = existing.restaurantId;
  if (input.restaurant.id && input.restaurant.id !== existing.restaurantId) {
    const restaurant = await upsertRestaurant(input.restaurant);
    if (!restaurant) return null;
    restaurantId = restaurant.id;
  }

  await db
    .update(visits)
    .set({
      restaurantId,
      visitedAt: input.visitedAt,
      overallRating: input.overallRating,
      comment: input.comment ?? null,
      totalPrice: input.totalPrice ?? null,
      wouldReturn: input.wouldReturn ?? true,
    })
    .where(eq(visits.id, id));

  // 菜式整批替換
  await db.delete(dishes).where(eq(dishes.visitId, id));
  if (input.dishes.length > 0) {
    await db.insert(dishes).values(
      input.dishes.map((d) => ({
        visitId: id,
        name: d.name,
        rating: d.rating ?? null,
        isRecommend: d.isRecommend ?? false,
        note: d.note ?? null,
      })),
    );
  }
  return getVisitWithRelations(id);
}

export async function deleteVisit(id: string) {
  const rows = await db.delete(visits).where(eq(visits.id, id)).returning({ id: visits.id });
  return rows.length > 0;
}

export async function updateRestaurant(
  id: string,
  patch: { name?: string; address?: string | null; cuisine?: string | null },
) {
  const rows = await db
    .update(restaurants)
    .set(patch)
    .where(eq(restaurants.id, id))
    .returning();
  return rows[0] ?? null;
}

export async function deleteRestaurant(id: string) {
  const rows = await db
    .delete(restaurants)
    .where(eq(restaurants.id, id))
    .returning({ id: restaurants.id });
  return rows.length > 0;
}
