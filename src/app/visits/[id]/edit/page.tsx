import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import VisitForm from "@/components/VisitForm";
import { db } from "@/db";
import { restaurants } from "@/db/schema";
import { getVisitWithRelations } from "@/lib/queries";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function VisitEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const visit = await getVisitWithRelations(id);
  if (!visit) notFound();

  const [restaurant] = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.id, visit.restaurant.id))
    .limit(1);

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
      <h1 className="mb-4 text-xl font-bold">✏️ 編輯食記</h1>
      <VisitForm
        mode="edit"
        initial={{
          visitId: visit.id,
          restaurant: {
            id: visit.restaurant.id,
            name: visit.restaurant.name,
            address: restaurant?.address ?? undefined,
            lat: restaurant?.lat,
            lng: restaurant?.lng,
            cuisine: restaurant?.cuisine ?? null,
          },
          visitedAt: visit.visitedAt,
          overallRating: visit.overallRating,
          comment: visit.comment,
          totalPrice: visit.totalPrice,
          wouldReturn: visit.wouldReturn,
          dishes: visit.dishes.map((d) => ({
            name: d.name,
            rating: d.rating,
            isRecommend: d.isRecommend,
            note: d.note,
          })),
        }}
      />
    </div>
  );
}
