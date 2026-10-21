import { NextResponse, type NextRequest } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import {
  createSessionToken,
  sessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  let password = "";
  try {
    const body = await req.json();
    password = typeof body?.password === "string" ? body.password : "";
  } catch {
    // 當作空密碼處理
  }

  const expected = process.env.AUTH_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { error: "伺服器未設定 AUTH_PASSWORD，無法登入" },
      { status: 500 },
    );
  }

  const given = createHash("sha256").update(password).digest();
  const wanted = createHash("sha256").update(expected).digest();
  if (!timingSafeEqual(given, wanted)) {
    return NextResponse.json({ error: "密碼錯誤" }, { status: 401 });
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
}
