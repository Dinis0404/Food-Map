import { z } from "zod";

export const restaurantInputSchema = z
  .object({
    /** 已存在嘅餐廳 id（優先） */
    id: z.string().uuid().optional(),
    name: z.string().trim().min(1, "餐廳名不可為空").max(200).optional(),
    address: z.string().trim().max(500).nullish(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    osmId: z.string().max(100).nullish(),
    cuisine: z.string().trim().max(50).nullish(),
  })
  .refine(
    (r) => r.id || (r.name && r.lat !== undefined && r.lng !== undefined),
    { message: "新餐廳需要名稱同座標" },
  );

export const dishInputSchema = z.object({
  name: z.string().trim().min(1, "菜名不可為空").max(200),
  rating: z.number().int().min(1).max(5).nullish(),
  isRecommend: z.boolean().nullish(),
  note: z.string().trim().max(500).nullish(),
});

export const visitInputSchema = z.object({
  restaurant: restaurantInputSchema,
  visitedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式為 YYYY-MM-DD"),
  overallRating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).nullish(),
  totalPrice: z.number().min(0).nullish(),
  wouldReturn: z.boolean().nullish(),
  dishes: z.array(dishInputSchema).max(50).default([]),
});

export type VisitInput = z.infer<typeof visitInputSchema>;

export const restaurantUpdateSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  address: z.string().trim().max(500).nullish(),
  cuisine: z.string().trim().max(50).nullish(),
});
