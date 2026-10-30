import { generateText } from "ai";
import { requireUser } from "@/lib/auth";
import { buildContext, ruleAnswer, systemPrompt } from "@/lib/chatbot";
import { readPlans, readQuestions } from "@/lib/store";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const hits = new Map<string, number[]>();
function limited(id: string) {
  const now = Date.now();
  const list = (hits.get(id) ?? []).filter((t) => now - t < 60_000);
  list.push(now);
  hits.set(id, list);
  return list.length > 15;
}

type Msg = { role: "user" | "assistant"; content: string };

// 읽기 전용: 이 경로는 저장소를 읽기만 하고 절대 쓰지 않는다.
export async function POST(request: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  if (limited(user.id)) return Response.json({ error: "잠시 후 다시 질문해 주세요. (1분 15회 제한)" }, { status: 429 });
  const body = (await request.json().catch(() => null)) as { messages?: Msg[] } | null;
  const messages = (body?.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 800) }));
  const last = messages.at(-1);
  if (!last || last.role !== "user") return Response.json({ error: "질문을 입력해 주세요." }, { status: 400 });

  const [plans, questions] = await Promise.all([readPlans(), readQuestions()]);
  const ctx = buildContext(plans.items, questions.items.filter((q) => q.active).sort((a, b) => a.order - b.order));
  const signals = ctx.signals.map(({ code, title, status, label, deadline }) => ({ code, title, status, label, deadline }));

  if (process.env.CP_CHAT_AI !== "off") {
    try {
      const result = await generateText({
        model: process.env.CP_CHAT_MODEL || "openai/gpt-4o-mini",
        system: systemPrompt(ctx),
        messages,
        maxOutputTokens: 700,
        abortSignal: AbortSignal.timeout(20_000),
      });
      if (result.text.trim()) return Response.json({ answer: result.text.trim(), source: "ai", signals });
    } catch (err) {
      console.error("cp-chat ai fallback:", (err as Error).message);
    }
  }
  return Response.json({ answer: ruleAnswer(ctx, last.content), source: "rule", signals });
}
