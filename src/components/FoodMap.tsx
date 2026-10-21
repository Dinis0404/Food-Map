"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import MapView from "./MapView";
import { StarDisplay } from "./StarRating";
import { formatDateShort } from "@/lib/format";
import type { RestaurantSummary } from "@/lib/queries";

export default function FoodMap() {
  const [restaurants, setRestaurants] = useState<RestaurantSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/restaurants")
      .then(async (r) => {
        if (r.status === 401) {
          window.location.href = "/login";
          return null;
        }
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => data && setRestaurants(data.restaurants))
      .catch(() => setError("載入唔到餐廳資料，請重新整理"));
  }, []);

  const points = useMemo(
    () =>
      (restaurants ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        lat: r.lat,
        lng: r.lng,
      })),
    [restaurants],
  );
  const selected = restaurants?.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col md:flex-row">
      {/* 地圖 */}
      <div className="relative order-first h-[45vh] min-h-0 md:order-last md:h-auto md:flex-1">
        {error && (
          <div className="absolute inset-x-4 top-4 z-10 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 shadow">
            {error}
          </div>
        )}
        <MapView
          points={points}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>

      {/* 側邊清單 */}
      <aside className="order-last flex min-h-0 w-full flex-col border-t border-stone-200 bg-white md:order-first md:w-96 md:border-t-0 md:border-r">
        <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
          <h1 className="font-semibold">
            覓食足跡{" "}
            <span className="text-sm font-normal text-stone-500">
              {restaurants ? `${restaurants.length} 間` : "…"}
            </span>
          </h1>
          <Link
            href="/visits/new"
            className="rounded-lg bg-amber-500 px-2.5 py-1 text-sm font-medium text-white hover:bg-amber-600"
          >
            ＋ 記錄
          </Link>
        </div>

        {selected && (
          <div className="border-b border-stone-100 bg-amber-50/60 px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate font-medium">{selected.name}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-600">
                  {selected.cuisine && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                      {selected.cuisine}
                    </span>
                  )}
                  <StarDisplay value={selected.avgRating} size="text-sm" />
                  <span>光顧 {selected.visitCount} 次</span>
                </div>
                {selected.lastVisitedAt && (
                  <div className="mt-0.5 text-xs text-stone-500">
                    最近：{formatDateShort(selected.lastVisitedAt)}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="shrink-0 rounded p-1 text-stone-400 hover:bg-stone-200"
                title="收起"
              >
                ✕
              </button>
            </div>
            <div className="mt-2 flex gap-2">
              <Link
                href={`/restaurants/${selected.id}`}
                className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-600"
              >
                睇餐廳檔案
              </Link>
              <Link
                href={`/visits/new?restaurant=${selected.id}`}
                className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm hover:bg-stone-50"
              >
                記返一次
              </Link>
            </div>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {restaurants == null ? (
            <div className="px-4 py-8 text-center text-stone-400">載入中…</div>
          ) : restaurants.length === 0 ? (
            <div className="px-4 py-10 text-center text-stone-500">
              <div className="mb-2 text-3xl">🍽️</div>
              仲未有記錄，快啲記低第一餐！
              <div className="mt-3">
                <Link
                  href="/visits/new"
                  className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-600"
                >
                  ＋ 記錄第一餐
                </Link>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {restaurants.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    className={`w-full px-4 py-3 text-left transition-colors hover:bg-amber-50 ${
                      r.id === selectedId ? "bg-amber-50" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">{r.name}</span>
                      <span className="shrink-0 text-sm text-amber-500">
                        {r.avgRating != null ? `★ ${r.avgRating}` : ""}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-stone-500">
                      {r.cuisine && <span>{r.cuisine}</span>}
                      <span>· 光顧 {r.visitCount} 次</span>
                      {r.lastVisitedAt && (
                        <span>· {formatDateShort(r.lastVisitedAt)}</span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
