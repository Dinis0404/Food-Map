"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PlaceSearch from "./PlaceSearch";
import { PickerMap } from "./MapView";
import { StarInput } from "./StarRating";
import { CUISINES } from "@/lib/constants";
import { todayLocalISO } from "@/lib/format";
import type { PlaceCandidate } from "@/lib/types";

export type DishFormValue = {
  name: string;
  rating: number | null;
  isRecommend: boolean;
  note: string | null;
};

export type VisitFormInitial = {
  visitId: string;
  restaurant: {
    id?: string;
    name?: string;
    address?: string;
    lat?: number;
    lng?: number;
    osmId?: string;
    cuisine?: string | null;
  };
  visitedAt: string;
  overallRating: number;
  comment: string | null;
  totalPrice: number | null;
  wouldReturn: boolean;
  dishes: DishFormValue[];
};

type PlaceState = {
  id?: string;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  osmId?: string;
};

type DishRowState = DishFormValue & { key: string };

const inputCls =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100";
const labelCls = "mb-1 block text-sm font-medium text-stone-700";

function emptyRow(key: string): DishRowState {
  return { key, name: "", rating: null, isRecommend: false, note: "" };
}

/** 只能在事件處理器中呼叫（含隨機成分，不符合 render purity） */
function freshKey(): string {
  return `dish-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function VisitForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: VisitFormInitial;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [place, setPlace] = useState<PlaceState | null>(
    initial?.restaurant.name
      ? {
          id: initial.restaurant.id,
          name: initial.restaurant.name,
          address: initial.restaurant.address ?? "",
          lat: initial.restaurant.lat,
          lng: initial.restaurant.lng,
          osmId: initial.restaurant.osmId,
        }
      : null,
  );
  const [cuisine, setCuisine] = useState(initial?.restaurant.cuisine ?? "");
  const [visitedAt, setVisitedAt] = useState(
    initial?.visitedAt ?? todayLocalISO(),
  );
  const [overallRating, setOverallRating] = useState(initial?.overallRating ?? 0);
  const [comment, setComment] = useState(initial?.comment ?? "");
  const [totalPrice, setTotalPrice] = useState(
    initial?.totalPrice != null ? String(initial.totalPrice) : "",
  );
  const [wouldReturn, setWouldReturn] = useState(initial?.wouldReturn ?? true);
  const [dishRows, setDishRows] = useState<DishRowState[]>(() =>
    initial?.dishes.length
      ? initial.dishes.map((d, i) => ({ ...d, key: `init-${i}` }))
      : [emptyRow("init-new")],
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // /visits/new?restaurant=<id>：帶入已有餐廳
  const prefillId =
    mode === "create" ? searchParams.get("restaurant") : null;
  useEffect(() => {
    if (!prefillId) return;
    let cancelled = false;
    fetch(`/api/restaurants/${prefillId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.restaurant) return;
        setPlace({
          id: data.restaurant.id,
          name: data.restaurant.name,
          address: data.restaurant.address ?? "",
          lat: data.restaurant.lat,
          lng: data.restaurant.lng,
        });
        if (data.restaurant.cuisine) setCuisine(data.restaurant.cuisine);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [prefillId]);

  function pickPlace(p: PlaceCandidate) {
    setPlace({
      id: undefined,
      name: p.name,
      address: p.address ?? "",
      lat: p.lat,
      lng: p.lng,
      osmId: p.osmId,
    });
  }

  function updateDish(key: string, patch: Partial<DishRowState>) {
    setDishRows((rows) =>
      rows.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!place || !place.name.trim()) {
      setError("請先選擇或輸入餐廳");
      return;
    }
    if (!place.id && (place.lat == null || place.lng == null)) {
      setError("請在地圖上點擊一下，為這家餐廳定位");
      return;
    }
    if (overallRating < 1) {
      setError("請為這一餐評分");
      return;
    }
    const dishes = dishRows.filter((d) => d.name.trim());
    if (dishes.length === 0) {
      setError("至少記錄一道菜");
      return;
    }
    const price = totalPrice.trim() === "" ? null : Number(totalPrice);
    if (price != null && (!Number.isFinite(price) || price < 0)) {
      setError("結帳金額格式不正確");
      return;
    }

    const payload = {
      restaurant: place.id
        ? { id: place.id }
        : {
            name: place.name.trim(),
            address: place.address.trim() || null,
            lat: place.lat,
            lng: place.lng,
            osmId: place.osmId ?? null,
            cuisine: cuisine.trim() || null,
          },
      visitedAt,
      overallRating,
      comment: comment.trim() || null,
      totalPrice: price,
      wouldReturn,
      dishes: dishes.map((d) => ({
        name: d.name.trim(),
        rating: d.rating,
        isRecommend: d.isRecommend,
        note: d.note?.trim() || null,
      })),
    };

    setSaving(true);
    try {
      const res = await fetch(
        mode === "create" ? "/api/visits" : `/api/visits/${initial?.visitId}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "儲存失敗，請再試一次");
        return;
      }
      const restaurantId = data?.restaurantId ?? data?.visit?.restaurant?.id;
      router.push(restaurantId ? `/restaurants/${restaurantId}` : "/visits");
      router.refresh();
    } catch {
      setError("網絡錯誤，請再試一次");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. 餐廳 */}
      <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold">🍴 哪家餐廳？</h2>

        {place?.id ? (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-amber-50 px-3 py-2.5">
            <div>
              <div className="font-medium">{place.name}</div>
              {place.address && (
                <div className="text-sm text-stone-500">{place.address}</div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setPlace(null)}
              className="shrink-0 rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-sm hover:bg-stone-50"
            >
              更換
            </button>
          </div>
        ) : place ? (
          <div className="space-y-3">
            <div>
              <label className={labelCls}>餐廳名稱</label>
              <input
                value={place.name}
                onChange={(e) => setPlace({ ...place, name: e.target.value })}
                className={inputCls}
                placeholder="餐廳名稱"
              />
            </div>
            <div>
              <label className={labelCls}>地址（可空）</label>
              <input
                value={place.address}
                onChange={(e) => setPlace({ ...place, address: e.target.value })}
                className={inputCls}
                placeholder="地址"
              />
            </div>
            <div>
              <label className={labelCls}>菜系（可空）</label>
              <input
                list="cuisine-options"
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                className={inputCls}
                placeholder="例如：日本菜"
              />
              <datalist id="cuisine-options">
                {CUISINES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <p className={labelCls}>
                定位：
                {place.lat != null ? (
                  <span className="font-normal text-green-700">
                    ✓ 已定位（可拖曳 pin 微調）
                  </span>
                ) : (
                  <span className="font-normal text-stone-500">
                    在下方地圖點擊一下
                  </span>
                )}
              </p>
              <PickerMap
                lat={place.lat}
                lng={place.lng}
                onChange={(lat, lng) => setPlace((p) => (p ? { ...p, lat, lng } : p))}
              />
            </div>
            <button
              type="button"
              onClick={() => setPlace(null)}
              className="text-sm text-stone-500 underline hover:text-stone-700"
            >
              重新搜尋
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <PlaceSearch onPick={pickPlace} />
            <div className="flex items-center gap-3 text-xs text-stone-400">
              <span className="h-px flex-1 bg-stone-200" />
              找不到？
              <button
                type="button"
                onClick={() =>
                  setPlace({ name: "", address: "", lat: undefined, lng: undefined })
                }
                className="font-medium text-amber-600 underline hover:text-amber-700"
              >
                手動輸入
              </button>
              <span className="h-px flex-1 bg-stone-200" />
            </div>
          </div>
        )}
      </section>

      {/* 2. 日期 */}
      <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold">📅 什麼時候去？</h2>
        <input
          type="date"
          value={visitedAt}
          onChange={(e) => setVisitedAt(e.target.value)}
          className={inputCls}
          required
        />
      </section>

      {/* 3. 菜式 */}
      <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">🍽️ 吃了什麼？</h2>
          <button
            type="button"
            onClick={() => {
              const row = emptyRow(freshKey());
              setDishRows((rows) => [...rows, row]);
            }}
            className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-sm font-medium text-amber-700 hover:bg-amber-100"
          >
            ＋ 加菜
          </button>
        </div>
        <div className="space-y-3">
          {dishRows.map((row, i) => (
            <div
              key={row.key}
              className="rounded-lg border border-stone-200 bg-stone-50 p-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-stone-400">{i + 1}.</span>
                <input
                  value={row.name}
                  onChange={(e) => updateDish(row.key, { name: e.target.value })}
                  className={inputCls}
                  placeholder="菜名，例如：酥皮焗叉燒包"
                />
                <button
                  type="button"
                  title="推介這道菜"
                  onClick={() =>
                    updateDish(row.key, { isRecommend: !row.isRecommend })
                  }
                  className={`shrink-0 rounded-lg px-2 py-1.5 text-sm ${
                    row.isRecommend
                      ? "bg-amber-400 text-white"
                      : "bg-white text-stone-400 ring-1 ring-stone-300 hover:text-amber-500"
                  }`}
                >
                  ⭐ 推介
                </button>
                <button
                  type="button"
                  title="刪除這道菜"
                  onClick={() =>
                    setDishRows((rows) => rows.filter((r) => r.key !== row.key))
                  }
                  className="shrink-0 rounded-lg px-2 py-1.5 text-stone-400 hover:bg-stone-200 hover:text-red-600"
                >
                  ✕
                </button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-stone-500">評分</span>
                  <StarInput
                    value={row.rating ?? 0}
                    onChange={(v) => updateDish(row.key, { rating: v })}
                    size="text-lg"
                  />
                  {row.rating != null && (
                    <button
                      type="button"
                      onClick={() => updateDish(row.key, { rating: null })}
                      className="text-xs text-stone-400 underline"
                    >
                      清除
                    </button>
                  )}
                </div>
                <input
                  value={row.note ?? ""}
                  onChange={(e) => updateDish(row.key, { note: e.target.value })}
                  className={`${inputCls} flex-1 min-w-40`}
                  placeholder="備註（例如：少甜）"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. 總評 */}
      <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold">💬 整體感受</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className={labelCls + " mb-0"}>整體評分 *</span>
            <StarInput value={overallRating} onChange={setOverallRating} />
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className={inputCls}
            placeholder="心得，例如：排隊半小時，但很值得；下次可以少叫一點…"
          />
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <span className="text-stone-700">結帳金額（$）</span>
              <input
                type="number"
                min="0"
                step="0.1"
                value={totalPrice}
                onChange={(e) => setTotalPrice(e.target.value)}
                className="w-28 rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                placeholder="可空"
              />
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={wouldReturn}
                onChange={(e) => setWouldReturn(e.target.checked)}
                className="h-4 w-4 accent-amber-500"
              />
              <span>會再去 🔄</span>
            </label>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-xl bg-amber-500 px-4 py-3 font-medium text-white shadow-sm transition-colors hover:bg-amber-600 disabled:opacity-60"
        >
          {saving ? "儲存中…" : mode === "create" ? "記下這一餐 🍜" : "更新食記"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-600 hover:bg-stone-50"
        >
          取消
        </button>
      </div>
    </form>
  );
}
