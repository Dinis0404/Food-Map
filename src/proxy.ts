import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authed = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value,
  );

  if (authed) {
    return NextResponse.next();
  }

  // API 路由回傳 401 JSON，頁面路由則 redirect 至登入頁
  if (pathname.startsWith("/api")) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp|woff2?)$).*)",
  ],
};
