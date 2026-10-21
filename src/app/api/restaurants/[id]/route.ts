import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  getRestaurantDetail,
  updateRestaurant,
  deleteRestaurant,
} from "@/lib/queries";
import { restaurantUpdateSchema } from "@/lib/validators";

const idSchema = z.string().uuid();

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) {
    return NextResponse.json({ error: "無效的 id" }, { status: 400 });
  }
  const detail = await getRestaurantDetail(id);
  if (!detail) return NextResponse.json({ error: "找不到餐廳" }, { status: 404 });
  return NextResponse.json(detail);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) {
    return NextResponse.json({ error: "無效的 id" }, { status: 400 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "無效的 JSON" }, { status: 400 });
  }
  const parsed = restaurantUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "資料格式錯誤";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const restaurant = await updateRestaurant(id, parsed.data);
  if (!restaurant) return NextResponse.json({ error: "找不到餐廳" }, { status: 404 });
  return NextResponse.json({ restaurant });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) {
    return NextResponse.json({ error: "無效的 id" }, { status: 400 });
  }
  const ok = await deleteRestaurant(id);
  if (!ok) return NextResponse.json({ error: "找不到餐廳" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
