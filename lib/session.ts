import { cookies } from "next/headers";
import { createHmac } from "crypto";

const COOKIE_NAME = "akinoglu_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 gün

export interface SessionUser {
  id: number;
  username: string;
  name: string;
}

function getSecret(): string {
  return process.env.SESSION_SECRET || "fallback-secret-akinoglu-tarim-2024";
}

function sign(payload: string): string {
  const secret = getSecret();
  const hmac = createHmac("sha256", secret);
  hmac.update(payload);
  const signature = hmac.digest("hex");
  return `${Buffer.from(payload).toString("base64url")}.${signature}`;
}

function verify(signed: string): string | null {
  const lastDot = signed.lastIndexOf(".");
  if (lastDot === -1) return null;
  const encodedPayload = signed.slice(0, lastDot);
  const signature = signed.slice(lastDot + 1);

  try {
    const payload = Buffer.from(encodedPayload, "base64url").toString("utf-8");
    const secret = getSecret();
    const hmac = createHmac("sha256", secret);
    hmac.update(payload);
    const expectedSig = hmac.digest("hex");
    if (signature === expectedSig) {
      return payload;
    }
  } catch {
    return null;
  }
  return null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const verified = verify(raw);
  if (!verified) return null;

  try {
    const parsed = JSON.parse(verified);
    if (parsed && typeof parsed.id === "number" && parsed.username) {
      return parsed as SessionUser;
    }
  } catch {
    // Eski basit format desteği ("authenticated")
    if (verified === "authenticated") {
      return { id: 0, username: "kullanici", name: "Kullanıcı" };
    }
  }
  return null;
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getSessionUser();
  return user !== null;
}

export async function createSession(user: SessionUser): Promise<void> {
  const cookieStore = await cookies();
  const payload = JSON.stringify(user);
  const signed = sign(payload);
  cookieStore.set(COOKIE_NAME, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
