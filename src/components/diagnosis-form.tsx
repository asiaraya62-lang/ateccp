"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SCALE, scaleLabel, scoreSnapshots, INFO_EXCHANGE_IDS } from "@/lib/scale";
import { ScoreReport } from "@/components/score-report";
import type { AnswerSnapshot, Company, PublicUser, Question, Submission } from "@/lib/types";

type Step =
  | { kind: "profile" }
  | { kind: "scale"; category: string; questions: Question[] }
  | { kind: "write"; questions: Question[] }
  | { kind: "review" };

export function DiagnosisForm({
  companies,
  questions,
  periodLabel,
  account,
  readOnly = false,
}: {
  companies: Company[];
  questions: Question[];
  periodLabel: string;
  account: PublicUser;
  readOnly?: boolean;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const companyId = account.companyId;
  const department = account.department;
  const name = account.name;
  const employeeNo = account.employeeNo;
  const email = account.email;
  const [reason, setReason] = useState<"monthly" | "audit">("monthly");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [complaint, setComplaint] = useState("");
  const [improvement, setImprovement] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<Submission | null>(null);

  const steps = useMemo<Step[]>(() => {
    const scale = questions.filter((item) => item.type === "scale");
    const categories = [...new Set(scale.map((item) => item.category))];
    const text = questions.filter((item) => item.type === "text");
    return [
      { kind: "profile" },
      ...categories.map((category) => ({
        kind: "scale" as const,
        category,
        questions: scale.filter((item) => item.category === category),
      })),
      { kind: "write", questions: text },
      { kind: "review" },
    ];
  }, [questions]);

  const step = steps[stepIndex];
  const snapshots = useMemo<AnswerSnapshot[]>(
    () =>
      questions.map((question) => ({
        questionId: question.id,
        prompt: question.prompt,
        type: question.type,
        value: answers[question.id] ?? "",
      })),
    [answers, questions],
  );
  const categoryById = useMemo(() => new Map(questions.map((q) => [q.id, q.category])), [questions]);
  const preview = scoreSnapshots(snapshots, (id) => categoryById.get(id) ?? "추가");

  function setAnswer(id: string, value: string) {
    setAnswers((current) => ({ ...current, [id]: value }));
  }

  function profileReady() {
    return Boolean(companyId && department.trim() && name.trim() && employeeNo.trim() && email.trim());
  }

  function stepReady(current = step) {
    if (!current) return false;
    if (current.kind === "profile") return profileReady();
    if (current.kind === "scale") return current.questions.every((question) => answers[question.id]);
    if (current.kind === "write") {
      return (
        current.questions.every((question) => (answers[question.id] ?? "").trim()) &&
        complaint.trim().length > 0 &&
        improvement.trim().length > 0
      );
    }
    return true;
  }

  function goNext() {
    if (!stepReady()) {
      setFormError("이 단계의 항목을 모두 입력해 주세요. 해당 없으면 ‘해당 업무 없음’, 할 말이 없으면 ‘없음’이라고 적어 주세요.");
      return;
    }
    setFormError("");
    setStepIndex((index) => Math.min(index + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    setSubmitting(true);
    setFormError("");
    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          department,
          name,
          employeeNo,
          email,
          reason,
          complaint,
          improvement,
          answers: questions.map((question) => ({ questionId: question.id, value: answers[question.id] ?? "" })),
          website: "",
        }),
      });
      const payload = (await response.json()) as { error?: string; submission?: Submission };
      if (!response.ok || !payload.submission) {
        throw new Error(payload.error || "제출에 실패했습니다.");
      }
      setReceipt(payload.submission);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (reasonError) {
      setFormError(reasonError instanceof Error ? reasonError.message : "제출에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!step) {
    return <p className="mx-auto max-w-3xl px-4 py-16 text-sm text-[#667386]">진단표를 준비하고 있습니다.</p>;
  }

  if (receipt) {
    const mailed =
      receipt.emailStatus === "sent"
        ? "담당자 메일로 발송했습니다."
        : receipt.emailStatus === "failed"
          ? "접수는 완료되었으나 메일 발송은 실패했습니다. 감사팀 수신함에서 확인할 수 있습니다."
          : "접수는 완료되었고 감사팀 수신함에 보관했습니다. 메일 서버를 연결하면 담당자에게 발송됩니다.";
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-xs tracking-wide text-[#8a7044]">제출 완료</p>
        <h1 className="mt-2 text-3xl font-semibold">자가진단을 접수했습니다</h1>
        <p className="mt-3 text-sm leading-7 text-[#4d5b6c]">{mailed}</p>
        <dl className="mt-6 grid gap-3 rounded-2xl border border-[#e4ddd2] bg-white p-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-[#667386]">접수번호</dt>
            <dd className="mt-1 font-medium">{receipt.id}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#667386]">준수 점수</dt>
            <dd className="mt-1 font-medium">{receipt.score === null ? "산출 없음" : `${receipt.score}점`}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#667386]">응답 / 해당 없음</dt>
            <dd className="mt-1 font-medium">
              {receipt.answeredScale}문항 / {receipt.notApplicable}문항
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#667386]">주의 문항</dt>
            <dd className="mt-1 font-medium">{receipt.attention.length}개</dd>
          </div>
        </dl>
        <div className="mt-6">
          <h2 className="mb-3 text-lg font-semibold">진단 결과</h2>
          <ScoreReport
            score={receipt.score}
            categories={receipt.categories ?? preview.categories}
            band={receipt.band ?? preview.band}
            redFlags={receipt.redFlags ?? preview.redFlags}
            infoExchange={receipt.infoExchange ?? preview.infoExchange}
          />
        </div>
        {receipt.attention.length > 0 ? (
          <div className="mt-4 rounded-2xl border border-[#efd2cc] bg-[#fff7f5] p-5">
            <h2 className="text-sm font-semibold">다시 볼 항목</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6">
              {receipt.attention.map((item) => (
                <li key={item.questionId}>
                  {item.prompt} <span className="text-[#8d3b32]">({scaleLabel(item.value)})</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <Button nativeButton={false} render={<Link href="/" />} className="mt-6 h-11 px-5" variant="outline">
          도입 현황으로
        </Button>
      </div>
    );
  }

  const progress = Math.round((stepIndex / (steps.length - 1)) * 100);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-xs tracking-wide text-[#8a7044]">개인평가 · {periodLabel || "이번 달"}</p>
      <h1 className="mt-2 text-3xl font-semibold">본인 자가진단</h1>
      <p className="mt-2 text-sm leading-7 text-[#4d5b6c]">
        객관식은 내 업무 기준입니다. 그 업무를 하지 않으면 ‘해당 업무 없음’을 고릅니다. 입력완료를 누르면
        감사팀 담당자에게 전달됩니다.
      </p>
      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#e6e0d6]">
        <div className="h-full bg-[#1d3b57]" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-2 text-xs text-[#667386]">
        {stepIndex + 1} / {steps.length}
      </p>

      <div className="mt-6 rounded-2xl border border-[#e4ddd2] bg-white p-5 sm:p-7">
        {step.kind === "profile" ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">제출자</h2>
            <p className="text-sm leading-6 text-[#667386]">회사, 부서, 이름, 사번, 이메일은 로그인한 계정으로 고정됩니다.</p>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-[#667386]">회사</dt>
                <dd className="mt-1 font-medium">{companies.find((company) => company.id === companyId)?.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#667386]">부서</dt>
                <dd className="mt-1 font-medium">{department}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#667386]">이름</dt>
                <dd className="mt-1 font-medium">{name}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#667386]">사번</dt>
                <dd className="mt-1 font-medium">{employeeNo}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-[#667386]">이메일</dt>
                <dd className="mt-1 font-medium">{email}</dd>
              </div>
            </dl>
            <fieldset>
              <legend className="text-sm font-medium">제출 구분</legend>
              <RadioGroup
                className="mt-2"
                value={reason}
                onValueChange={(value) => setReason(value === "audit" ? "audit" : "monthly")}
              >
                {[
                  ["monthly", "월 1회 정기 제출"],
                  ["audit", "감사팀 요청에 따른 추가 제출"],
                ].map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 rounded-lg border border-[#e4ddd2] px-3 py-3 text-sm">
                    <RadioGroupItem value={value} />
                    {label}
                  </label>
                ))}
              </RadioGroup>
            </fieldset>
          </div>
        ) : null}

        {step.kind === "scale" ? (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">{step.category}</h2>
            {step.questions.map((question, index) => (
              <fieldset key={question.id} className="border-t border-[#f0ebe3] pt-4">
                <legend className="text-sm leading-6">
                  <span className="mr-2 text-xs text-[#8a7044]">{String(question.order).padStart(2, "0")}</span>
                  {INFO_EXCHANGE_IDS.has(question.id) ? (
                    <span className="mr-2 rounded bg-[#c0392b] px-1.5 py-0.5 text-[10px] font-semibold text-white">정보교환 주의</span>
                  ) : null}
                  {question.prompt}
                </legend>
                {question.hint ? (
                  <p className="mt-1 rounded-lg bg-[#f6f2ea] px-3 py-2 text-xs leading-5 text-[#4d5b6c]">💡 {question.hint}</p>
                ) : null}
                <RadioGroup
                  className="mt-3 grid gap-2 sm:grid-cols-2"
                  value={answers[question.id] ?? ""}
                  onValueChange={(value) => setAnswer(question.id, String(value))}
                  aria-label={`${index + 1}번 문항`}
                >
                  {SCALE.map((option) => (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm ${
                        answers[question.id] === option.value ? "border-[#1d3b57] bg-[#f4f7fa]" : "border-[#e4ddd2]"
                      }`}
                    >
                      <RadioGroupItem value={option.value} />
                      {option.label}
                    </label>
                  ))}
                </RadioGroup>
              </fieldset>
            ))}
          </div>
        ) : null}

        {step.kind === "write" ? (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold">주관식, 불만, 개선</h2>
            {step.questions.map((question) => (
              <div key={question.id}>
                <Label htmlFor={question.id}>{question.prompt}</Label>
                {question.hint ? <p className="mt-1 text-xs leading-5 text-[#667386]">{question.hint}</p> : null}
                <Textarea
                  id={question.id}
                  className="mt-2 min-h-24 bg-white text-base"
                  value={answers[question.id] ?? ""}
                  onChange={(event) => setAnswer(question.id, event.target.value)}
                />
              </div>
            ))}
            <div>
              <Label htmlFor="complaint">불만 사항</Label>
              <p className="mt-1 text-xs text-[#667386]">공정거래나 CP 운영에서 불편한 점을 적어 주세요. 없으면 없음.</p>
              <Textarea id="complaint" className="mt-2 min-h-24 bg-white text-base" value={complaint} onChange={(event) => setComplaint(event.target.value)} />
            </div>
            <div>
              <Label htmlFor="improvement">개선 사항</Label>
              <p className="mt-1 text-xs text-[#667386]">제도, 교육, 업무 절차에서 바꾸면 좋은 점을 적어 주세요. 없으면 없음.</p>
              <Textarea id="improvement" className="mt-2 min-h-24 bg-white text-base" value={improvement} onChange={(event) => setImprovement(event.target.value)} />
            </div>
          </div>
        ) : null}

        {step.kind === "review" ? (
          <div className="space-y-4 text-sm leading-7">
            <h2 className="text-lg font-semibold">입력 확인</h2>
            <p>
              {companies.find((company) => company.id === companyId)?.name} · {department} · {name} · {employeeNo}
            </p>
            <p>
              구분 {reason === "monthly" ? "월례 정기" : "감사팀 요청"} · 예상 점수{" "}
              {preview.score === null ? "산출 없음" : `${preview.score}점`} · 주의 {preview.attention.length}문항
            </p>
            <div className="rounded-2xl border border-[#e4ddd2] bg-[#fbf9f5] p-4">
              <p className="mb-3 text-sm font-semibold">예상 진단 결과 (제출 전 미리보기 · 저장되지 않음)</p>
              <ScoreReport {...preview} />
            </div>
            <p className="text-[#667386]">입력완료를 누르면 수정할 수 없습니다. 월례 제출은 같은 사번으로 한 달에 한 번입니다.</p>
          </div>
        ) : null}

        {formError ? <p className="mt-4 text-sm text-[#8d3b32]">{formError}</p> : null}

        <div className="mt-6 flex flex-wrap justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 px-4"
            disabled={stepIndex === 0}
            onClick={() => {
              setFormError("");
              setStepIndex((index) => Math.max(0, index - 1));
            }}
          >
            이전
          </Button>
          {step.kind === "review" ? (
            <Button type="button" className="h-11 px-5" disabled={readOnly || submitting || questions.length === 0} onClick={submit}>
              {readOnly ? "조회 전용" : submitting ? "전달 중" : "입력완료"}
            </Button>
          ) : (
            <Button type="button" className="h-11 px-5" disabled={questions.length === 0} onClick={goNext}>
              {questions.length === 0 ? "문항 준비 중" : "다음"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
