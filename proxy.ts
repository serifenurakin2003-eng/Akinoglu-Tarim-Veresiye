import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const COOKIE_NAME = "akinoglu_session";

interface SessionPayload {
  id: number;
  username: string;
  name: string;
}

function verify(signed: string): SessionPayload | null {
  const secret = process.env.SESSION_SECRET || "fallback-secret-akinoglu-tarim-2024";
  const lastDot = signed.lastIndexOf(".");
  if (lastDot === -1) return null;

  const encodedPayload = signed.slice(0, lastDot);
  const suppliedSignature = Buffer.from(signed.slice(lastDot + 1), "hex");

  try {
    const payload = Buffer.from(encodedPayload, "base64url").toString("utf-8");
    const hmac = createHmac("sha256", secret);
    hmac.update(payload);
    const expectedSignature = Buffer.from(hmac.digest("hex"), "hex");

    if (
      suppliedSignature.length !== expectedSignature.length ||
      !timingSafeEqual(suppliedSignature, expectedSignature)
    ) {
      return null;
    }

    const parsed = JSON.parse(payload) as Partial<SessionPayload>;
    if (
      !Number.isInteger(parsed.id) ||
      (parsed.id ?? 0) <= 0 ||
      typeof parsed.username !== "string" ||
      !parsed.username
    ) {
      return null;
    }

    return {
      id: parsed.id as number,
      username: parsed.username,
      name: typeof parsed.name === "string" ? parsed.name : "",
    };
  } catch {
    return null;
  }
}

async function hasActiveUser(session: SessionPayload | null): Promise<boolean> {
  if (!session) return false;

  try {
    const user = await prisma.kullanicilar.findFirst({
      where: {
        kullanici_id: session.id,
        kullanici_adi: session.username,
      },
      select: { kullanici_id: true },
    });
    return Boolean(user);
  } catch {
    // Fail closed if the account table cannot be checked.
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Statik varlıklara her zaman izin ver
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const raw = request.cookies.get(COOKIE_NAME)?.value;
  const session = raw ? verify(raw) : null;
  const isAuthenticated = await hasActiveUser(session);

  if (pathname.startsWith("/login")) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
