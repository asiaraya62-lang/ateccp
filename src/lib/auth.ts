import { cookies } from "next/headers";
import { readUsers } from "./store";
import { readSessionToken, SESSION_COOKIE } from "./session";
import type { PublicUser } from "./types";

export function toPublicUser(user: { passwordHash: string } & PublicUser): PublicUser {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const jar = await cookies();
  const session = readSessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const users = await readUsers();
  const user = users.items.find((item) => item.id === session.sub);
  if (!user?.approved) return null;
  return toPublicUser(user);
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, error: Response.json({ error: "로그인이 필요합니다." }, { status: 401 }) };
  }
  return { user, error: null };
}

export async function requireAudit() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (user.role !== "audit") {
    return Response.json({ error: "감사팀 관리자만 접근할 수 있습니다." }, { status: 403 });
  }
  return null;
}

const READONLY_EMPLOYEE_NOS = new Set(["EVAL01"]);
export const READ_ONLY_MESSAGE = "평가위원 계정은 조회만 가능합니다.";

export function isReadOnlyUser(user: { readOnly?: boolean; employeeNo: string } | null | undefined) {
  if (!user) return false;
  return user.readOnly === true || READONLY_EMPLOYEE_NOS.has(user.employeeNo.toUpperCase());
}

export function readOnlyResponse() {
  return Response.json({ error: READ_ONLY_MESSAGE }, { status: 403 });
}

/** Audit role required and the account must not be read-only (for mutations). */
export async function requireAuditWrite() {
  const denied = await requireAudit();
  if (denied) return denied;
  const user = await getCurrentUser();
  if (isReadOnlyUser(user)) return readOnlyResponse();
  return null;
}
