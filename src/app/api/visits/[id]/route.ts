import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getVisitWithRelations, updateVisit, deleteVisit } from "@/lib/queries";
import { visitInputSchema } from "@/lib/validators";

const idSchema = z.string().uuid();

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) {
    return NextResponse.json({ error: "無效的 id" }, { status: 400 });
  }
  const visit = await getVisitWithRelations(id);
  if (!visit) return NextResponse.json({ error: "找不到食記" }, { status: 404 });
  return NextResponse.json({ visit });
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
  const parsed = visitInputSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "資料格式錯誤";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const visit = await updateVisit(id, parsed.data);
  if (!visit) return NextResponse.json({ error: "找不到食記" }, { status: 404 });
  return NextResponse.json({ visit });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) {
    return NextResponse.json({ error: "無效的 id" }, { status: 400 });
  }
  const ok = await deleteVisit(id);
  if (!ok) return NextResponse.json({ error: "找不到食記" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
