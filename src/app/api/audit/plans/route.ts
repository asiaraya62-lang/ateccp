import { requireAudit } from "@/lib/auth";
import { readPlans, savePlans } from "@/lib/store";

function percent(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.max(0, Math.min(100, Math.round(number)));
}

export async function PATCH(request: Request) {
  const denied = await requireAudit();
  if (denied) return denied;
  const body = (await request.json().catch(() => null)) as {
    id?: string;
    current?: unknown;
    targetYear?: unknown;
    targetLong?: unknown;
  } | null;
  const current = percent(body?.current);
  const targetYear = percent(body?.targetYear);
  const targetLong = percent(body?.targetLong);
  if (!body?.id || current === null || targetYear === null || targetLong === null) {
    return Response.json({ error: "달성률과 목표치는 0에서 100 사이여야 합니다." }, { status: 400 });
  }
  const plans = await readPlans();
  const index = plans.items.findIndex((item) => item.id === body.id);
  if (index < 0) return Response.json({ error: "실행 과제를 찾지 못했습니다." }, { status: 404 });
  plans.items[index] = { ...plans.items[index], current, targetYear, targetLong };
  await savePlans(plans.items);
  return Response.json({ item: plans.items[index] });
}
