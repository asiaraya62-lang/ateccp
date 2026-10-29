import { requireUser } from "@/lib/auth";
import { scoreSnapshots } from "@/lib/scale";
import { sendSubmission } from "@/lib/email";
import { seoulPeriod } from "@/lib/period";
import { isReadOnlyStoreError, readCompanies, readQuestions, readSubmissions, updateSubmissions } from "@/lib/store";
import type { AnswerSnapshot, Submission } from "@/lib/types";

const SCALE = new Set(["1", "2", "3", "4", "5", "na"]);

function clean(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

export async function GET() {
  const { user, error } = await requireUser();
  if (error || !user) return error;
  const items = await readSubmissions();
  const mine = items
    .filter(
      (item) =>
        item.companyId === user.companyId && item.employeeNo.toLowerCase() === user.employeeNo.toLowerCase(),
    )
    .reverse();
  return Response.json({ items: mine });
}

export async function POST(request: Request) {
  const { user, error } = await requireUser();
  if (error || !user) return error;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "제출 내용을 읽지 못했습니다." }, { status: 400 });
  if (clean(body.website, 80)) return Response.json({ error: "제출을 접수하지 못했습니다." }, { status: 400 });

  const companyId = user.companyId;
  const department = user.department;
  const name = user.name;
  const employeeNo = user.employeeNo;
  const email = user.email;
  const reason = body.reason === "audit" ? "audit" : body.reason === "monthly" ? "monthly" : "";
  const complaint = clean(body.complaint, 2000);
  const improvement = clean(body.improvement, 2000);
  const rawAnswers = Array.isArray(body.answers) ? body.answers : [];

  if (!companyId || !department || !name || !employeeNo || !reason) {
    return Response.json({ error: "회사, 부서, 이름, 사번, 제출 구분을 입력해 주세요." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "이메일 주소를 확인해 주세요." }, { status: 400 });
  }
  if (!complaint || !improvement) {
    return Response.json({ error: "불만 사항과 개선 사항을 입력해 주세요. 없으면 없음이라고 적어 주세요." }, { status: 400 });
  }

  const companies = await readCompanies();
  const company = companies.items.find((item) => item.id === companyId);
  if (!company) return Response.json({ error: "회사를 다시 선택해 주세요." }, { status: 400 });

  const questions = await readQuestions();
  const active = questions.items.filter((item) => item.active).sort((a, b) => a.order - b.order);
  const incoming = new Map<string, string>();
  for (const entry of rawAnswers) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as { questionId?: unknown; value?: unknown };
    incoming.set(clean(record.questionId, 40), clean(record.value, 2000));
  }

  const answers: AnswerSnapshot[] = [];
  for (const question of active) {
    const value = incoming.get(question.id) ?? "";
    if (question.type === "scale") {
      if (!SCALE.has(value)) {
        return Response.json({ error: "객관식 문항에 답하지 않은 항목이 있습니다." }, { status: 400 });
      }
    } else if (question.required && value.length < 1) {
      return Response.json({ error: "주관식 문항을 모두 입력해 주세요. 없으면 없음이라고 적어 주세요." }, { status: 400 });
    }
    answers.push({
      questionId: question.id,
      prompt: question.prompt,
      type: question.type,
      value,
    });
  }

  const period = seoulPeriod();
  const scored = scoreSnapshots(answers);
  const now = new Date();
  const id = `CP-${period.replace("-", "")}-${now.getTime().toString(36).toUpperCase()}`;
  const draft: Submission = {
    id,
    submittedAt: now.toISOString(),
    period,
    reason,
    companyId: company.id,
    companyName: company.name,
    department,
    name,
    employeeNo,
    email,
    answers,
    complaint,
    improvement,
    score: scored.score,
    answeredScale: scored.answeredScale,
    notApplicable: scored.notApplicable,
    attention: scored.attention,
    emailStatus: "queued",
    emailDetail: "",
  };
  let stored = false;
  try {
    await updateSubmissions((submissions) => {
      if (reason === "monthly") {
        const existing = submissions.find(
          (item) =>
            item.period === period &&
            item.reason === "monthly" &&
            item.employeeNo.toLowerCase() === employeeNo.toLowerCase() &&
            item.companyId === companyId,
        );
        if (existing) {
          const error = new Error("이번 달 정기 자가진단은 이미 제출되어 있습니다. 감사팀이 다시 요청하면 ‘감사팀 요청’으로 제출해 주세요.");
          throw error;
        }
      }
      submissions.push(draft);
      return submissions;
    });
    stored = true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "제출을 저장하지 못했습니다.";
    if (message.includes("이미 제출")) {
      return Response.json({ error: message }, { status: 409 });
    }
    if (!isReadOnlyStoreError(error)) {
      return Response.json({ error: message }, { status: 500 });
    }
  }

  const mailed = await sendSubmission(draft);
  const saved: Submission = { ...draft, ...mailed };
  if (!stored && saved.emailStatus !== "sent") {
    return Response.json(
      {
        error:
          "이 주소에서는 제출 원장을 파일로 남길 수 없습니다. 담당자 메일을 연결한 뒤 다시 제출해 주세요.",
      },
      { status: 503 },
    );
  }
  if (stored) {
    try {
      await updateSubmissions((submissions) =>
        submissions.map((item) => (item.id === saved.id ? saved : item)),
      );
    } catch (error) {
      if (!isReadOnlyStoreError(error)) throw error;
    }
  }
  return Response.json({ submission: saved });
}
