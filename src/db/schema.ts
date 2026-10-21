import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const restaurants = pgTable(
  "restaurants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    /** OpenStreetMap place id（格式 "N123456/W789/R..."），用於防止重複新增 */
    osmId: text("osm_id"),
    /** 預留：日後切換 Google Places 時用 */
    googlePlaceId: text("google_place_id"),
    address: text("address"),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    cuisine: text("cuisine"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("restaurants_osm_id_key").on(t.osmId),
    index("restaurants_lat_lng_idx").on(t.lat, t.lng),
  ],
);

export const visits = pgTable(
  "visits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    /** 格式 YYYY-MM-DD */
    visitedAt: date("visited_at").notNull(),
    overallRating: integer("overall_rating").notNull(),
    comment: text("comment"),
    totalPrice: real("total_price"),
    wouldReturn: boolean("would_return").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("visits_restaurant_idx").on(t.restaurantId),
    index("visits_visited_at_idx").on(t.visitedAt),
  ],
);

export const dishes = pgTable(
  "dishes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    visitId: uuid("visit_id")
      .notNull()
      .references(() => visits.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    rating: integer("rating"),
    isRecommend: boolean("is_recommend").notNull().default(false),
    note: text("note"),
  },
  (t) => [index("dishes_visit_idx").on(t.visitId)],
);

export type Restaurant = typeof restaurants.$inferSelect;
export type Visit = typeof visits.$inferSelect;
export type Dish = typeof dishes.$inferSelect;
