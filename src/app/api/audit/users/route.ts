import { requireAudit, toPublicUser } from "@/lib/auth";
import { readUsers, updateUsers } from "@/lib/store";
import type { UserRole } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAudit();
  if (denied) return denied;
  const users = await readUsers();
  return Response.json({
    items: users.items
      .map(toPublicUser)
      .sort((a, b) => Number(a.approved) - Number(b.approved) || a.name.localeCompare(b.name, "ko")),
  });
}

export async function PATCH(request: Request) {
  const denied = await requireAudit();
  if (denied) return denied;
  const body = (await request.json().catch(() => null)) as {
    id?: string;
    approved?: boolean;
    role?: UserRole;
  } | null;
  if (!body?.id) return Response.json({ error: "직원을 지정해 주세요." }, { status: 400 });
  if (body.role && body.role !== "employee" && body.role !== "audit") {
    return Response.json({ error: "권한을 다시 선택해 주세요." }, { status: 400 });
  }
  const current = await readUsers();
  const target = current.items.find((item) => item.id === body.id);
  if (!target) return Response.json({ error: "직원을 찾지 못했습니다." }, { status: 404 });
  const nextApproved = body.approved ?? target.approved;
  const nextRole = body.role ?? target.role;
  const auditCount = current.items.filter((item) => item.approved && item.role === "audit" && item.id !== target.id).length;
  if (target.approved && target.role === "audit" && auditCount === 0 && (!nextApproved || nextRole !== "audit")) {
    return Response.json({ error: "마지막 감사팀 관리자의 권한은 내릴 수 없습니다." }, { status: 400 });
  }
  const items = await updateUsers((users) =>
    users.map((item) => (item.id === body.id ? { ...item, approved: nextApproved, role: nextRole } : item)),
  );
  const saved = items.find((item) => item.id === body.id);
  return Response.json({ item: saved ? toPublicUser(saved) : null });
}

export async function DELETE(request: Request) {
  const denied = await requireAudit();
  if (denied) return denied;
  const body = (await request.json().catch(() => null)) as { id?: string } | null;
  if (!body?.id) return Response.json({ error: "직원을 지정해 주세요." }, { status: 400 });
  const current = await readUsers();
  const target = current.items.find((item) => item.id === body.id);
  if (!target) return Response.json({ error: "직원을 찾지 못했습니다." }, { status: 404 });
  if (target.approved || target.role === "audit" || target.employeeNo.toUpperCase() === "AUDIT") {
    return Response.json({ error: "승인 대기 중인 일반 직원만 반려할 수 있습니다." }, { status: 400 });
  }
  await updateUsers((users) =>
    users.filter((item) => !(item.id === body.id && !item.approved && item.role !== "audit")),
  );
  return Response.json({ ok: true });
}
