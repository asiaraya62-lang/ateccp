import { requireAudit, requireAuditWrite } from "@/lib/auth";
import { readQuestions, saveQuestions } from "@/lib/store";
import type { Question } from "@/lib/types";

export const dynamic = "force-dynamic";

function clean(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

export async function GET() {
  const denied = await requireAudit();
  if (denied) return denied;
  const questions = await readQuestions();
  return Response.json({
    updatedAt: questions.updatedAt,
    items: [...questions.items].sort((a, b) => a.order - b.order),
  });
}

export async function POST(request: Request) {
  const denied = await requireAuditWrite();
  if (denied) return denied;
  const body = (await request.json().catch(() => null)) as Partial<Question> | null;
  const prompt = clean(body?.prompt, 500);
  const category = clean(body?.category, 40) || "추가";
  const type = body?.type === "text" ? "text" : "scale";
  if (!prompt) return Response.json({ error: "문항 내용을 입력해 주세요." }, { status: 400 });
  const questions = await readQuestions();
  const order = questions.items.reduce((max, item) => Math.max(max, item.order), 0) + 1;
  const item: Question = {
    id: `${type === "text" ? "t" : "s"}${Date.now().toString(36)}`,
    category,
    prompt,
    type,
    required: true,
    active: true,
    order,
    hint: clean(body?.hint, 300),
  };
  questions.items.push(item);
  await saveQuestions(questions.items);
  return Response.json({ item });
}

export async function PATCH(request: Request) {
  const denied = await requireAuditWrite();
  if (denied) return denied;
  const body = (await request.json().catch(() => null)) as Partial<Question> | null;
  if (!body?.id) return Response.json({ error: "문항을 지정해 주세요." }, { status: 400 });
  const questions = await readQuestions();
  const index = questions.items.findIndex((item) => item.id === body.id);
  if (index < 0) return Response.json({ error: "문항을 찾지 못했습니다." }, { status: 404 });
  const current = questions.items[index];
  const prompt = body.prompt === undefined ? current.prompt : clean(body.prompt, 500);
  if (!prompt) return Response.json({ error: "문항 내용을 비울 수 없습니다." }, { status: 400 });
  questions.items[index] = {
    ...current,
    prompt,
    category: body.category === undefined ? current.category : clean(body.category, 40) || current.category,
    hint: body.hint === undefined ? current.hint : clean(body.hint, 300),
    active: body.active === undefined ? current.active : Boolean(body.active),
    order: body.order === undefined ? current.order : Math.max(1, Math.round(Number(body.order) || current.order)),
  };
  await saveQuestions(questions.items);
  return Response.json({ item: questions.items[index] });
}
