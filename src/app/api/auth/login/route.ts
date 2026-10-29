import { cookies } from "next/headers";
import { toPublicUser } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from "@/lib/session";
import { readUsers } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { employeeNo?: string; password?: string } | null;
  const employeeNo = body?.employeeNo?.trim() ?? "";
  const password = body?.password ?? "";
  if (!employeeNo || !password) {
    return Response.json({ error: "사번과 비밀번호를 입력해 주세요." }, { status: 400 });
  }
  const users = await readUsers();
  const user = users.items.find((item) => item.employeeNo.toLowerCase() === employeeNo.toLowerCase());
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return Response.json({ error: "사번 또는 비밀번호가 맞지 않습니다." }, { status: 401 });
  }
  if (!user.approved) {
    return Response.json({ error: "감사팀 승인 대기 중입니다. 승인된 뒤에 들어갈 수 있습니다." }, { status: 403 });
  }
  const jar = await cookies();
  jar.set(SESSION_COOKIE, createSessionToken(user), sessionCookieOptions());
  return Response.json({ user: toPublicUser(user) });
}
