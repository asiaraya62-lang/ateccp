import { requireAuditWrite, requireUser } from "@/lib/auth";
import { sortSchedule } from "@/lib/schedule";
import { readSchedule, updateSchedule } from "@/lib/store";
import type { ScheduleItem } from "@/lib/types";

export const dynamic = "force-dynamic";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
function clean(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}
function parse(body: Record<string, unknown>, base?: ScheduleItem): ScheduleItem | string {
  const pick = (key: keyof ScheduleItem, max: number) => (body[key] === undefined && base ? String(base[key]) : clean(body[key], max));
  const start = pick("start", 10);
  const end = pick("end", 10);
  const title = pick("title", 200);
  if (!DATE.test(start)) return "시작 날짜를 YYYY-MM-DD 형식으로 입력해 주세요.";
  if (end && (!DATE.test(end) || end < start)) return "종료 날짜를 확인해 주세요.";
  if (!title) return "내용을 입력해 주세요.";
  const kind = pick("kind", 4) === "교육" ? "교육" : "활동";
  const status = pick("status", 4) === "완료" ? "완료" : "예정";
  return {
    id: base?.id ?? `sch${Date.now().toString(36)}`,
    start,
    end,
    kind,
    title,
    target: pick("target", 80),
    owner: pick("owner", 80),
    status,
    isDefault: base ? base.isDefault && body.title === undefined : false,
  };
}

export async function GET() {
  const { error } = await requireUser();
  if (error) return error;
  const data = await readSchedule();
  return Response.json({ updatedAt: data.updatedAt, items: sortSchedule(data.items) });
}

export async function POST(request: Request) {
  const denied = await requireAuditWrite();
  if (denied) return denied;
  const body = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  const item = parse(body);
  if (typeof item === "string") return Response.json({ error: item }, { status: 400 });
  await updateSchedule((items) => [...items, item]);
  return Response.json({ item });
}

export async function PATCH(request: Request) {
  const denied = await requireAuditWrite();
  if (denied) return denied;
  const body = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  const id = clean(body.id, 40);
  let result: ScheduleItem | string = "일정을 찾지 못했습니다.";
  await updateSchedule((items) =>
    items.map((current) => {
      if (current.id !== id) return current;
      result = parse(body, current);
      return typeof result === "string" ? current : result;
    }),
  );
  if (typeof result === "string") return Response.json({ error: result }, { status: 400 });
  return Response.json({ item: result });
}

export async function DELETE(request: Request) {
  const denied = await requireAuditWrite();
  if (denied) return denied;
  const id = clean(new URL(request.url).searchParams.get("id"), 40);
  let found = false;
  await updateSchedule((items) => items.filter((item) => (item.id === id ? ((found = true), false) : true)));
  if (!found) return Response.json({ error: "일정을 찾지 못했습니다." }, { status: 404 });
  return Response.json({ ok: true });
}
