import { requireAuditWrite } from "@/lib/auth";
import { readCompanies, saveCompanies } from "@/lib/store";
import type { Company } from "@/lib/types";

function clean(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

export async function PUT(request: Request) {
  const denied = await requireAuditWrite();
  if (denied) return denied;
  const body = (await request.json().catch(() => null)) as Partial<Company> & { create?: boolean } | null;
  if (!body) return Response.json({ error: "내용을 확인해 주세요." }, { status: 400 });
  const name = clean(body.name, 60);
  const short = clean(body.short, 20);
  const focus = clean(body.focus, 40);
  const headcount = Math.max(0, Math.round(Number(body.headcount)));
  if (!name || !short || !Number.isFinite(headcount)) {
    return Response.json({ error: "회사명, 짧은 이름, 대상 인원을 입력해 주세요." }, { status: 400 });
  }
  const companies = await readCompanies();
  if (body.create) {
    const id = `c${Date.now().toString(36)}`;
    const item: Company = { id, name, short, focus, headcount };
    companies.items.push(item);
    await saveCompanies(companies.items);
    return Response.json({ item });
  }
  const index = companies.items.findIndex((item) => item.id === body.id);
  if (index < 0) return Response.json({ error: "회사를 찾지 못했습니다." }, { status: 404 });
  companies.items[index] = { ...companies.items[index], name, short, focus, headcount };
  await saveCompanies(companies.items);
  return Response.json({ item: companies.items[index] });
}
