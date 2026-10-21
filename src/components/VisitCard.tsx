import Link from "next/link";
import { StarDisplay } from "./StarRating";
import { formatDate, formatMoney } from "@/lib/format";
import type { VisitWithRelations } from "@/lib/queries";

export default function VisitCard({
  visit,
  showRestaurant = true,
}: {
  visit: VisitWithRelations;
  showRestaurant?: boolean;
}) {
  return (
    <article className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {showRestaurant && (
            <Link
              href={`/restaurants/${visit.restaurant.id}`}
              className="font-semibold hover:text-amber-600"
            >
              {visit.restaurant.name}
            </Link>
          )}
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-500">
            <span>📅 {formatDate(visit.visitedAt)}</span>
            <StarDisplay value={visit.overallRating} size="text-sm" />
            <span className={visit.wouldReturn ? "text-green-700" : "text-stone-400"}>
              {visit.wouldReturn ? "👍 會再去" : "🤔 唔會再去"}
            </span>
            {visit.totalPrice != null && (
              <span>💰 {formatMoney(visit.totalPrice)}</span>
            )}
          </div>
        </div>
        <Link
          href={`/visits/${visit.id}`}
          className="shrink-0 text-sm text-stone-400 underline hover:text-amber-600"
        >
          詳情
        </Link>
      </div>

      {visit.dishes.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {visit.dishes.map((d) => (
            <span
              key={d.id}
              className={`rounded-full px-2.5 py-0.5 text-sm ${
                d.isRecommend
                  ? "bg-amber-100 font-medium text-amber-800"
                  : "bg-stone-100 text-stone-700"
              }`}
            >
              {d.isRecommend && "⭐ "}
              {d.name}
              {d.rating != null && ` ★${d.rating}`}
            </span>
          ))}
        </div>
      )}

      {visit.comment && (
        <p className="mt-2 text-sm whitespace-pre-wrap text-stone-600">
          {visit.comment}
        </p>
      )}
    </article>
  );
}
