import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

const COOKIE_NAME = "akinoglu_session";

function verify(signed: string): boolean {
  const secret = process.env.SESSION_SECRET || "fallback-secret-akinoglu-tarim-2024";
  const lastDot = signed.lastIndexOf(".");
  if (lastDot === -1) return false;
  const encodedPayload = signed.slice(0, lastDot);
  const signature = signed.slice(lastDot + 1);

  try {
    const payload = Buffer.from(encodedPayload, "base64url").toString("utf-8");
    const hmac = createHmac("sha256", secret);
    hmac.update(payload);
    const expectedSig = hmac.digest("hex");
    if (signature === expectedSig) return true;
  } catch {
    // fallback
  }

  // Eski tekil format desteği
  const hmacOld = createHmac("sha256", secret);
  hmacOld.update(encodedPayload);
  return signature === hmacOld.digest("hex");
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Statik varlıklara her zaman izin ver
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Cookie kontrolü
  const raw = request.cookies.get(COOKIE_NAME)?.value;
  const isAuthenticated = raw ? verify(raw) : false;

  // Login sayfası kontrolü
  if (pathname.startsWith("/login")) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Diğer tüm sayfalar için giriş kontrolü
  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

