import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { type NextRequest } from "next/server";

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET!);
const COOKIE_NAME = "session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type SessionPayload = {
  profileId: string;
  email: string;
};

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function isAllowedDomain(email: string): boolean {
  const raw = process.env.ALLOWED_EMAIL_DOMAINS ?? "";
  if (!raw) return true; // no restriction configured
  const allowed = raw
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  const domain = email.split("@")[1]?.toLowerCase();
  return !!domain && allowed.includes(domain);
}

/**
 * Dev-only bypass: if NODE_ENV=development and the request carries a
 * `x-dev-profile-id` header, return a fake session so routes can be tested
 * without a real login. Never active in production.
 */
export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  if (process.env.NODE_ENV === "development") {
    const devId = req.headers.get("x-dev-profile-id");
    if (devId) return { profileId: devId, email: "dev@local" };
  }
  return getSession();
}
