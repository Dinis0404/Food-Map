"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteVisitButton({
  visitId,
  redirectTo,
}: {
  visitId: string;
  redirectTo: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("刪除呢篇食記？刪咗就搵唔返㗎喇。")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/visits/${visitId}`, { method: "DELETE" });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      router.push(redirectTo);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
    >
      {deleting ? "刪除中…" : "🗑️ 刪除"}
    </button>
  );
}

export function DeleteRestaurantButton({ restaurantId }: { restaurantId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        "刪除餐廳會連埋佢所有食記一齊剷走，確定？此操作無得復原。",
      )
    )
      return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}`, {
        method: "DELETE",
      });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
    >
      {deleting ? "刪除中…" : "🗑️ 刪除餐廳"}
    </button>
  );
}
