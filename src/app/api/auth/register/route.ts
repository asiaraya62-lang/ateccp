import { hashPassword } from "@/lib/password";
import { readCompanies, updateUsers } from "@/lib/store";
import { isReadOnlyStoreError } from "@/lib/store";

export const dynamic = "force-dynamic";

function clean(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "신청 내용을 읽지 못했습니다." }, { status: 400 });
  const employeeNo = clean(body.employeeNo, 30);
  const name = clean(body.name, 40);
  const email = clean(body.email, 120);
  const companyId = clean(body.companyId, 40);
  const department = clean(body.department, 80);
  const password = String(body.password ?? "");
  if (!employeeNo || !name || !companyId || !department) {
    return Response.json({ error: "회사, 부서, 이름, 사번을 입력해 주세요." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "이메일 주소를 확인해 주세요." }, { status: 400 });
  }
  if (password.length < 8) {
    return Response.json({ error: "비밀번호는 8자 이상으로 정해 주세요." }, { status: 400 });
  }
  const companies = await readCompanies();
  if (!companies.items.some((item) => item.id === companyId)) {
    return Response.json({ error: "회사를 다시 선택해 주세요." }, { status: 400 });
  }
  try {
    await updateUsers((items) => {
      const duplicate = items.find(
        (item) =>
          item.employeeNo.toLowerCase() === employeeNo.toLowerCase() ||
          item.email.toLowerCase() === email.toLowerCase(),
      );
      if (duplicate) throw new Error("이미 등록된 사번 또는 이메일입니다.");
      items.push({
        id: `u-${Date.now().toString(36)}`,
        employeeNo,
        name,
        email,
        companyId,
        department,
        role: "employee",
        approved: false,
        passwordHash: hashPassword(password),
        createdAt: new Date().toISOString(),
      });
      return items;
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "신청을 저장하지 못했습니다.";
    if (message.includes("이미 등록")) return Response.json({ error: message }, { status: 409 });
    if (isReadOnlyStoreError(error)) {
      return Response.json({ error: "이 주소에서는 직원 명단을 저장할 수 없습니다." }, { status: 503 });
    }
    return Response.json({ error: message }, { status: 500 });
  }
  return Response.json({ ok: true });
}
