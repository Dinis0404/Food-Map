import { NextResponse, type NextRequest } from "next/server";
import { listVisits, createVisit } from "@/lib/queries";
import { visitInputSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const num = (key: string) => {
    const v = sp.get(key);
    if (!v) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  const visits = await listVisits({
    q: sp.get("q") ?? undefined,
    from: sp.get("from") ?? undefined,
    to: sp.get("to") ?? undefined,
    minRating: num("minRating"),
    recommendOnly: sp.get("recommendOnly") === "1",
    restaurantId: sp.get("restaurantId") ?? undefined,
    sort: (sp.get("sort") as "newest" | "oldest" | "rating" | null) ?? undefined,
    limit: num("limit"),
  });
  return NextResponse.json({ visits });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "無效的 JSON" }, { status: 400 });
  }

  const parsed = visitInputSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "資料格式錯誤";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const result = await createVisit(parsed.data);
  if (!result) {
    return NextResponse.json(
      { error: "無法建立餐廳記錄：缺少名稱或座標" },
      { status: 400 },
    );
  }
  return NextResponse.json(
    { visitId: result.visit.id, restaurantId: result.restaurant.id },
    { status: 201 },
  );
}
