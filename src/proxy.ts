import { NextResponse, type NextRequest } from "next/server";
import { readSessionToken, sessionCookieOptions, SESSION_COOKIE } from "@/lib/session";
import { readUsers } from "@/lib/store";

const PUBLIC_PATHS = new Set(["/login", "/api/auth/login", "/api/auth/register"]);

function clearSession(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  return response;
}

function deny(request: NextRequest, clear: boolean) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/")) {
    const response = NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    return clear ? clearSession(response) : response;
  }
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  const response = NextResponse.redirect(url);
  return clear ? clearSession(response) : response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();

  const session = readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return deny(request, false);

  const users = await readUsers();
  const user = users.items.find((item) => item.id === session.sub);
  if (!user?.approved) return deny(request, true);

  const auditOnly = pathname === "/audit" || pathname.startsWith("/audit/") || pathname.startsWith("/api/audit");
  if (auditOnly && user.role !== "audit") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "감사팀 관리자만 접근할 수 있습니다." }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2)$).*)"],
};
