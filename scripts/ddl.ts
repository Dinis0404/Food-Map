/** 資料表 DDL——同 src/db/schema.ts 對應，本地腳本共用 */
export const DDL = `
CREATE TABLE IF NOT EXISTS restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  osm_id text,
  google_place_id text,
  address text,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  cuisine text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS restaurants_osm_id_key ON restaurants (osm_id);
CREATE INDEX IF NOT EXISTS restaurants_lat_lng_idx ON restaurants (lat, lng);

CREATE TABLE IF NOT EXISTS visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  visited_at date NOT NULL,
  overall_rating integer NOT NULL,
  comment text,
  total_price real,
  would_return boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS visits_restaurant_idx ON visits (restaurant_id);
CREATE INDEX IF NOT EXISTS visits_visited_at_idx ON visits (visited_at);

CREATE TABLE IF NOT EXISTS dishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  name text NOT NULL,
  rating integer,
  is_recommend boolean NOT NULL DEFAULT false,
  note text
);
CREATE INDEX IF NOT EXISTS dishes_visit_idx ON dishes (visit_id);
`;

export type SeedRestaurant = {
  name: string;
  address: string;
  lat: number;
  lng: number;
  cuisine: string;
  visits: {
    visitedAt: string;
    overallRating: number;
    comment: string;
    totalPrice: number;
    wouldReturn: boolean;
    dishes: {
      name: string;
      rating: number | null;
      isRecommend: boolean;
      note?: string;
    }[];
  }[];
};

export const SEED: SeedRestaurant[] = [
  {
    name: "添好運點心專門店",
    address: "香港中環奧卑利街15-16號地下",
    lat: 22.2814,
    lng: 114.1572,
    cuisine: "點心",
    visits: [
      {
        visitedAt: "2026-09-12",
        overallRating: 5,
        comment: "平靚正嘅代表，酥皮焗叉燒包一試難忘，下次要早啲嚟避開人潮。",
        totalPrice: 180,
        wouldReturn: true,
        dishes: [
          { name: "酥皮焗叉燒包", rating: 5, isRecommend: true, note: "必叫，兩個人一籠剛好" },
          { name: "黃金流沙包", rating: 4, isRecommend: false, note: "趁熱食" },
          { name: "香煎馬來糕", rating: 4, isRecommend: false },
        ],
      },
      {
        visitedAt: "2026-05-03",
        overallRating: 4,
        comment: "今次排隊耐咗啲，水準依舊。",
        totalPrice: 150,
        wouldReturn: true,
        dishes: [
          { name: "晶瑩鮮蝦餃", rating: 4, isRecommend: false },
          { name: "豉汁蒸鳳爪", rating: 4, isRecommend: true },
        ],
      },
    ],
  },
  {
    name: "一蘭拉麵",
    address: "香港銅鑼灣謝斐道535號地下",
    lat: 22.2799,
    lng: 114.1812,
    cuisine: "拉麵",
    visits: [
      {
        visitedAt: "2026-08-20",
        overallRating: 4,
        comment: "湯底濃郁，但排隊半粒鐘有點誇張，唔係時時都想再排。",
        totalPrice: 145,
        wouldReturn: false,
        dishes: [
          { name: "天然豚骨拉麵", rating: 5, isRecommend: true, note: "辣度 1/2、麵硬、蔥多" },
          { name: "溏心蛋", rating: 4, isRecommend: false },
          { name: "抹茶豆腐甜品", rating: 3, isRecommend: false, note: "普通，可以唔叫" },
        ],
      },
    ],
  },
  {
    name: "麥文記麵家",
    address: "香港佐敦白加士街51號地下",
    lat: 22.3048,
    lng: 114.1714,
    cuisine: "粉麵",
    visits: [
      {
        visitedAt: "2026-10-05",
        overallRating: 5,
        comment: "雲吞皮薄餡靚，全蛋麵爽口，米芝蓮推介實至名歸。",
        totalPrice: 68,
        wouldReturn: true,
        dishes: [
          { name: "全蛋雲吞麵", rating: 5, isRecommend: true, note: "淨食雲吞都得" },
          { name: "薑蔥撈麵", rating: 4, isRecommend: false },
        ],
      },
    ],
  },
  {
    name: "華嫂冰室",
    address: "香港元朗青山公路屏山段98號地下",
    lat: 22.244,
    lng: 114.035,
    cuisine: "茶餐廳",
    visits: [
      {
        visitedAt: "2026-07-18",
        overallRating: 4,
        comment: "菠蘿油夠脆，番茄通粉好喝，週末多人要等位。",
        totalPrice: 55,
        wouldReturn: true,
        dishes: [
          { name: "菠蘿油", rating: 5, isRecommend: true },
          { name: "番茄濃湯通粉", rating: 4, isRecommend: true },
          { name: "凍檸茶", rating: 4, isRecommend: false },
        ],
      },
    ],
  },
];
