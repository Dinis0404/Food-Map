import Link from "next/link";
import { notFound } from "next/navigation";
import { StarDisplay } from "@/components/StarRating";
import { DeleteVisitButton } from "@/components/DeleteButtons";
import { getVisitWithRelations } from "@/lib/queries";
import { formatDate, formatMoney } from "@/lib/format";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function VisitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const visit = await getVisitWithRelations(id);
  if (!visit) notFound();

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/visits" className="text-sm text-stone-500 hover:text-amber-600">
          ← 返回列表
        </Link>
        <div className="flex gap-2">
          <Link
            href={`/visits/${visit.id}/edit`}
            className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-50"
          >
            ✏️ 編輯
          </Link>
          <DeleteVisitButton visitId={visit.id} redirectTo="/visits" />
        </div>
      </div>

      <article className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold">
          <Link
            href={`/restaurants/${visit.restaurant.id}`}
            className="hover:text-amber-600"
          >
            {visit.restaurant.name}
          </Link>
        </h1>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-stone-500">
          <span>📅 {formatDate(visit.visitedAt)}</span>
          <StarDisplay value={visit.overallRating} />
          <span className={visit.wouldReturn ? "text-green-700" : "text-stone-400"}>
            {visit.wouldReturn ? "👍 會再去" : "🤔 不會再去"}
          </span>
          {visit.totalPrice != null && (
            <span>💰 結帳 {formatMoney(visit.totalPrice)}</span>
          )}
        </div>

        <div className="mt-5">
          <h2 className="mb-2 text-sm font-semibold text-stone-700">
            🍽️ 吃了什麼（{visit.dishes.length} 道）
          </h2>
          {visit.dishes.length === 0 ? (
            <p className="text-sm text-stone-400">沒有記錄菜式</p>
          ) : (
            <ul className="space-y-2">
              {visit.dishes.map((d) => (
                <li
                  key={d.id}
                  className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2"
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-medium">
                      {d.isRecommend && "⭐ "}
                      {d.name}
                    </span>
                    {d.rating != null && (
                      <StarDisplay value={d.rating} size="text-sm" />
                    )}
                  </div>
                  {d.note && (
                    <div className="mt-0.5 text-sm text-stone-500">💡 {d.note}</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-5">
          <h2 className="mb-2 text-sm font-semibold text-stone-700">💬 心得</h2>
          {visit.comment ? (
            <p className="whitespace-pre-wrap text-sm text-stone-600">
              {visit.comment}
            </p>
          ) : (
            <p className="text-sm text-stone-400">沒有寫心得</p>
          )}
        </div>
      </article>
    </div>
  );
}
