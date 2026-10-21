"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CUISINES } from "@/lib/constants";
import type { RestaurantRow } from "@/lib/queries";

const inputCls =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100";

export default function RestaurantEditForm({
  restaurant,
}: {
  restaurant: RestaurantRow;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(restaurant.name);
  const [address, setAddress] = useState(restaurant.address ?? "");
  const [cuisine, setCuisine] = useState(restaurant.cuisine ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setMsg("餐廳名不可為空");
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/restaurants/${restaurant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          address: address.trim() || null,
          cuisine: cuisine.trim() || null,
        }),
      });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setMsg(data?.error ?? "更新失敗");
        return;
      }
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-50"
      >
        ✏️ 編輯餐廳資料
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSave}
      className="w-full space-y-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">
          餐廳名稱
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCls}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">
          地址
        </label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className={inputCls}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">
          菜系
        </label>
        <input
          list="cuisine-options-edit"
          value={cuisine}
          onChange={(e) => setCuisine(e.target.value)}
          className={inputCls}
        />
        <datalist id="cuisine-options-edit">
          {CUISINES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>
      {msg && <div className="text-sm text-red-600">{msg}</div>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-60"
        >
          {saving ? "儲存中…" : "儲存"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setMsg(null);
          }}
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-50"
        >
          收起
        </button>
      </div>
    </form>
  );
}
