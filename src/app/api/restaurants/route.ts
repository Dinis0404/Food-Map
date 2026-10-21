import { NextResponse } from "next/server";
import { listRestaurantSummaries } from "@/lib/queries";

export async function GET() {
  const restaurants = await listRestaurantSummaries();
  return NextResponse.json({ restaurants });
}
