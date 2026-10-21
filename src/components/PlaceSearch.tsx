"use client";

import { useEffect, useRef, useState } from "react";
import type { PlaceCandidate } from "@/lib/types";

export default function PlaceSearch({
  onPick,
}: {
  onPick: (p: PlaceCandidate) => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PlaceCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const query = q.trim();

  useEffect(() => {
    if (query.length < 2) {
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/places/search?q=${encodeURIComponent(query)}`,
        );
        const data = await res.json();
        if (!cancelled) {
          setResults(data.results ?? []);
          setOpen(true);
        }
      } catch {
        // 搜尋服務無法連通：保持無結果，用戶可以手動輸入
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={boxRef} className="relative">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="搜尋餐廳，例如「一蘭拉麵 銅鑼灣」"
        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
      />
      {loading && (
        <span className="absolute top-2.5 right-3 text-sm text-stone-400">
          搜尋中…
        </span>
      )}
      {open && query.length >= 2 && results.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-stone-200 bg-white shadow-lg">
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-amber-50"
                onClick={() => {
                  onPick(r);
                  setOpen(false);
                }}
              >
                <div className="text-sm font-medium">{r.name}</div>
                {r.address && (
                  <div className="line-clamp-1 text-xs text-stone-500">
                    {r.address}
                  </div>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && !loading && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-500 shadow-lg">
          找不到相符地點，可以改用下方的「手動輸入」
        </div>
      )}
    </div>
  );
}
