"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "地圖", icon: "🗺️" },
  { href: "/visits", label: "食記", icon: "📔" },
];

export default function NavBar() {
  const pathname = usePathname();

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-xl">🍜</span>
          <span>食記地圖</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {links.map((l) => {
            const active =
              l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 transition-colors ${
                  active
                    ? "bg-amber-100 text-amber-800 font-medium"
                    : "text-stone-600 hover:bg-stone-100"
                }`}
              >
                <span className="mr-1">{l.icon}</span>
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/visits/new"
            className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-600"
          >
            ＋ 記錄食評
          </Link>
          <button
            type="button"
            onClick={logout}
            title="登出"
            className="rounded-lg px-2.5 py-1.5 text-sm text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800"
          >
            登出
          </button>
        </div>
      </div>
    </header>
  );
}
