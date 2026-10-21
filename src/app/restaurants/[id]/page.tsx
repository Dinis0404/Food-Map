import Link from "next/link";
import { notFound } from "next/navigation";
import VisitCard from "@/components/VisitCard";
import MiniMapView from "@/components/MiniMapView";
import RestaurantEditForm from "@/components/RestaurantEditForm";
import { DeleteRestaurantButton } from "@/components/DeleteButtons";
import { StarDisplay } from "@/components/StarRating";
import { getRestaurantDetail } from "@/lib/queries";
import { formatDate, formatDateShort } from "@/lib/format";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const detail = await getRestaurantDetail(id);
  if (!detail) notFound();
  const { restaurant, stats, visits, dishSummary } = detail;

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <Link href="/" className="text-sm text-stone-500 hover:text-amber-600">
        ← 返回地圖
      </Link>

      {/* 餐廳基本資料 */}
      <header className="mt-3 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">{restaurant.name}</h1>
            {restaurant.address && (
              <p className="mt-1 text-sm text-stone-500">📍 {restaurant.address}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              {restaurant.cuisine && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-amber-800">
                  {restaurant.cuisine}
                </span>
              )}
              <StarDisplay value={stats.avgRating} />
            </div>
          </div>
          <div className="flex flex-col items-stretch gap-2">
            <Link
              href={`/visits/new?restaurant=${restaurant.id}`}
              className="rounded-lg bg-amber-500 px-3 py-1.5 text-center text-sm font-medium text-white hover:bg-amber-600"
            >
              ＋ 記返一次
            </Link>
            <RestaurantEditForm restaurant={restaurant} />
            <DeleteRestaurantButton restaurantId={restaurant.id} />
          </div>
        </div>

        {/* 統計 */}
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-stone-50 px-2 py-3">
            <div className="text-2xl font-bold text-amber-600">
              {stats.visitCount}
            </div>
            <div className="text-xs text-stone-500">光顧次數</div>
          </div>
          <div className="rounded-xl bg-stone-50 px-2 py-3">
            <div className="text-2xl font-bold text-amber-600">
              {stats.avgRating ?? "—"}
            </div>
            <div className="text-xs text-stone-500">平均評分</div>
          </div>
          <div className="rounded-xl bg-stone-50 px-2 py-3">
            <div className="text-sm font-bold text-stone-700">
              {stats.lastVisitedAt ? formatDateShort(stats.lastVisitedAt) : "—"}
            </div>
            <div className="text-xs text-stone-500">最近光顧</div>
          </div>
        </div>
      </header>

      {/* 地圖 + 菜式統計 */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold">🗺️ 位置</h2>
          <MiniMapView lat={restaurant.lat} lng={restaurant.lng} name={restaurant.name} />
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold">
            🌟 菜式推介榜{" "}
            <span className="text-sm font-normal text-stone-500">
              （跨多次光顧統計）
            </span>
          </h2>
          {dishSummary.length === 0 ? (
            <p className="text-sm text-stone-400">仲未有菜式記錄</p>
          ) : (
            <ul className="space-y-2">
              {dishSummary.slice(0, 8).map((d) => (
                <li
                  key={d.name}
                  className="flex items-center justify-between gap-2 rounded-lg bg-stone-50 px-3 py-2"
                >
                  <span className="min-w-0 truncate text-sm font-medium">
                    {d.recommendCount > 0 && "⭐ "}
                    {d.name}
                  </span>
                  <span className="shrink-0 text-xs text-stone-500">
                    食過 {d.times} 次
                    {d.avgRating != null && ` · ★${d.avgRating}`}
                    {d.recommendCount > 0 && ` · 推介 ${d.recommendCount}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* 歷史食記 */}
      <section className="mt-4">
        <h2 className="mb-3 font-semibold">
          📔 歷史食記{" "}
          <span className="text-sm font-normal text-stone-500">
            {visits.length} 篇
          </span>
        </h2>
        {visits.length === 0 ? (
          <p className="rounded-xl border border-dashed border-stone-300 bg-white px-4 py-8 text-center text-stone-500">
            仲未去過？
          </p>
        ) : (
          <ul className="space-y-3">
            {visits.map((v) => (
              <li key={v.id}>
                <VisitCard visit={v} showRestaurant={false} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-6 text-center text-xs text-stone-400">
        加入於 {formatDate(restaurant.createdAt.toISOString().slice(0, 10))}
      </p>
    </div>
  );
}
