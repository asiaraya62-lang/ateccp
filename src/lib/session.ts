import { createHmac, timingSafeEqual } from "crypto";
import type { UserRole } from "./types";

export const SESSION_COOKIE = "atec_cp_session";
export const SESSION_MAX_AGE = 60 * 60 * 12;

export type SessionToken = {
  sub: string;
  role: UserRole;
  exp: number;
};

function secret() {
  const value = process.env.CP_SESSION_SECRET || process.env.CP_AUDIT_SECRET;
  if (value) return value;
  if (process.env.VERCEL === "1") {
    throw new Error("CP_SESSION_SECRET is required");
  }
  return "atec-cp-desk-local-secret";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionToken(user: { id: string; role: UserRole }) {
  const payload = Buffer.from(
    JSON.stringify({
      sub: user.id,
      role: user.role,
      exp: Date.now() + SESSION_MAX_AGE * 1000,
    }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readSessionToken(token: string | undefined | null): SessionToken | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as Partial<SessionToken>;
    if (!data.sub || (data.role !== "employee" && data.role !== "audit")) return null;
    if (!data.exp || data.exp < Date.now()) return null;
    return { sub: data.sub, role: data.role, exp: data.exp };
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.CP_COOKIE_SECURE === "true",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}
