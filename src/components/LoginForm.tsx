"use client";

import { useState } from "react";

export default function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        const from = new URLSearchParams(window.location.search).get("from") || "/";
        window.location.assign(from);
        return;
      }
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "登入失敗，請再試");
    } catch {
      setError("網絡錯誤，請再試");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
    >
      <div className="mb-4 text-center">
        <div className="text-4xl">🍜</div>
        <h1 className="mt-2 text-xl font-bold">食記地圖</h1>
        <p className="mt-1 text-sm text-stone-500">私人覓食足跡，請先登入</p>
      </div>
      <label className="mb-1 block text-sm font-medium text-stone-700">密碼</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoFocus
        className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
        placeholder="輸入密碼"
      />
      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading || !password}
        className="mt-4 w-full rounded-xl bg-amber-500 py-2.5 font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-60"
      >
        {loading ? "登入中…" : "登入"}
      </button>
    </form>
  );
}
