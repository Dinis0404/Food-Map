import Link from "next/link";
import VisitCard from "@/components/VisitCard";
import { listVisits } from "@/lib/queries";

export const metadata = { title: "食記列表 | 食記地圖" };

const inputCls =
  "rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function VisitsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const get = (k: string) => {
    const v = sp[k];
    return typeof v === "string" && v !== "" ? v : undefined;
  };
  const sortParam = get("sort");
  const minRating = get("min") ? Number(get("min")) : undefined;

  const visits = await listVisits({
    q: get("q"),
    from: get("from"),
    to: get("to"),
    minRating:
      minRating != null && Number.isFinite(minRating) ? minRating : undefined,
    recommendOnly: get("rec") === "1",
    sort:
      sortParam === "oldest" || sortParam === "rating" ? sortParam : undefined,
  });

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">
          📔 食記列表{" "}
          <span className="text-sm font-normal text-stone-500">
            共 {visits.length} 篇
          </span>
        </h1>
        <Link
          href="/visits/new"
          className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-600"
        >
          ＋ 記錄食評
        </Link>
      </div>

      <form className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
        <input
          name="q"
          defaultValue={get("q") ?? ""}
          placeholder="餐廳名稱"
          className={inputCls}
        />
        <input type="date" name="from" defaultValue={get("from") ?? ""} className={inputCls} />
        <span className="text-sm text-stone-400">至</span>
        <input type="date" name="to" defaultValue={get("to") ?? ""} className={inputCls} />
        <select name="min" defaultValue={get("min") ?? ""} className={inputCls}>
          <option value="">評分不限</option>
          <option value="5">≥ 5★</option>
          <option value="4">≥ 4★</option>
          <option value="3">≥ 3★</option>
        </select>
        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            name="rec"
            value="1"
            defaultChecked={get("rec") === "1"}
            className="h-4 w-4 accent-amber-500"
          />
          有推介
        </label>
        <select name="sort" defaultValue={sortParam ?? "newest"} className={inputCls}>
          <option value="newest">由新到舊</option>
          <option value="oldest">由舊到新</option>
          <option value="rating">評分由高到低</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-stone-800 px-3 py-1.5 text-sm text-white hover:bg-stone-700"
        >
          篩選
        </button>
        <Link href="/visits" className="text-sm text-stone-400 underline">
          清除
        </Link>
      </form>

      {visits.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white px-4 py-12 text-center text-stone-500">
          <div className="mb-2 text-3xl">🍃</div>
          沒有符合條件的食記
        </div>
      ) : (
        <ul className="space-y-3">
          {visits.map((v) => (
            <li key={v.id}>
              <VisitCard visit={v} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
