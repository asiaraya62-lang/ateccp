"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { scaleLabel } from "@/lib/scale";
import { seoulStamp } from "@/lib/period";
import type { Company, Overview, PlanItem, PublicUser, Question, Submission } from "@/lib/types";

async function readJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || "요청을 처리하지 못했습니다.");
  return payload;
}

export function AuditConsole() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [staff, setStaff] = useState<PublicUser[]>([]);
  const [openId, setOpenId] = useState("");

  async function loadDesk() {
    const [nextOverview, nextSubmissions, nextQuestions, nextStaff] = await Promise.all([
      readJson<Overview>("/api/overview"),
      readJson<{ items: Submission[] }>("/api/audit/submissions"),
      readJson<{ items: Question[] }>("/api/audit/questions"),
      readJson<{ items: PublicUser[] }>("/api/audit/users"),
    ]);
    setOverview(nextOverview);
    setSubmissions(nextSubmissions.items);
    setQuestions(nextQuestions.items);
    setStaff(nextStaff.items);
  }

  useEffect(() => {
    loadDesk()
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setReady(true));
  }, []);

  if (!ready) return <p className="mx-auto max-w-5xl px-4 py-16 text-sm text-[#667386]">감사팀 화면을 확인하고 있습니다.</p>;

  if (!overview) {
    return <p className="mx-auto max-w-5xl px-4 py-16 text-sm text-[#8d3b32]">{error || "자료를 불러오는 중입니다."}</p>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs tracking-wide text-[#8a7044]">감사팀</p>
          <h1 className="mt-1 text-3xl font-semibold">CP 운영 데스크</h1>
        </div>
        <p className="text-sm text-[#667386]">승인된 감사팀 관리자 화면입니다.</p>
      </div>
      {error ? <p className="mt-4 text-sm text-[#8d3b32]">{error}</p> : null}
      <Tabs defaultValue="inbox" className="mt-6">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="inbox">제출 {submissions.length}</TabsTrigger>
          <TabsTrigger value="plans">실행 진척</TabsTrigger>
          <TabsTrigger value="questions">문항 {questions.filter((item) => item.active).length}</TabsTrigger>
          <TabsTrigger value="companies">계열사</TabsTrigger>
          <TabsTrigger value="staff">
            직원 {staff.length}
            {staff.some((item) => !item.approved) ? ` · 대기 ${staff.filter((item) => !item.approved).length}` : ""}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="inbox" className="mt-4">
          <Inbox
            items={submissions}
            openId={openId}
            onOpen={setOpenId}
            onDownload={() => {
              const blob = new Blob([JSON.stringify(submissions, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = "cp-submissions.json";
              link.click();
              URL.revokeObjectURL(url);
            }}
          />
        </TabsContent>
        <TabsContent value="plans" className="mt-4">
          <PlanEditor
            items={overview.plans}
            onSaved={(item) =>
              setOverview({ ...overview, plans: overview.plans.map((plan) => (plan.id === item.id ? item : plan)) })
            }
          />
        </TabsContent>
        <TabsContent value="questions" className="mt-4">
          <QuestionEditor items={questions} onChange={setQuestions} />
        </TabsContent>
        <TabsContent value="staff" className="mt-4">
          <StaffEditor items={staff} companies={overview.companies} onChange={setStaff} />
        </TabsContent>
        <TabsContent value="companies" className="mt-4">
          <CompanyEditor
            items={overview.companies}
            onChange={(companies) =>
              setOverview({
                ...overview,
                companies: companies.map((company) => {
                  const previous = overview.companies.find((item) => item.id === company.id);
                  return {
                    ...company,
                    submitted: previous?.submitted ?? 0,
                    rate: previous && previous.headcount === company.headcount ? previous.rate : 0,
                  };
                }),
              })
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Inbox({
  items,
  openId,
  onOpen,
  onDownload,
}: {
  items: Submission[];
  openId: string;
  onOpen: (id: string) => void;
  onDownload: () => void;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#d7d0c4] bg-white p-8 text-sm leading-7 text-[#4d5b6c]">
        아직 제출이 없습니다. 구성원이 입력완료를 하면 이곳에 원문이 쌓이고, 메일 서버가 연결되면 담당자에게도 발송됩니다.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" onClick={onDownload}>
          원장 내려받기
        </Button>
      </div>
      {items.map((item) => (
        <article key={item.id} className="rounded-2xl border border-[#e4ddd2] bg-white p-4">
          <button type="button" className="w-full text-left" onClick={() => onOpen(openId === item.id ? "" : item.id)}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-medium">
                {item.companyName} · {item.department} · {item.name}
              </p>
              <p className="text-xs text-[#667386]">{seoulStamp(new Date(item.submittedAt))}</p>
            </div>
            <p className="mt-1 text-xs text-[#667386]">
              {item.reason === "monthly" ? "월례" : "감사팀 요청"} · {item.score === null ? "점수 없음" : `${item.score}점`} · 주의{" "}
              {item.attention.length} · {item.emailStatus === "sent" ? "메일 발송" : item.emailStatus === "failed" ? "메일 실패" : "수신함 보관"}
            </p>
          </button>
          {openId === item.id ? (
            <div className="mt-4 space-y-3 border-t border-[#f0ebe3] pt-4 text-sm leading-6">
              <p>
                {item.id} · {item.employeeNo} · {item.email}
              </p>
              <p className="text-[#667386]">{item.emailDetail}</p>
              <Section title="주의 문항">
                {item.attention.length
                  ? item.attention.map((answer) => (
                      <p key={answer.questionId}>
                        {answer.prompt} ({scaleLabel(answer.value)})
                      </p>
                    ))
                  : "없음"}
              </Section>
              <Section title="주관식">
                {item.answers
                  .filter((answer) => answer.type === "text")
                  .map((answer) => (
                    <p key={answer.questionId}>
                      <span className="text-[#667386]">{answer.prompt}</span>
                      <br />
                      {answer.value}
                    </p>
                  ))}
              </Section>
              <Section title="불만 사항">{item.complaint}</Section>
              <Section title="개선 사항">{item.improvement}</Section>
              <Section title="객관식">
                {item.answers
                  .filter((answer) => answer.type === "scale")
                  .map((answer) => (
                    <p key={answer.questionId}>
                      {answer.prompt} → {scaleLabel(answer.value)}
                    </p>
                  ))}
              </Section>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold tracking-wide text-[#8a7044]">{title}</h3>
      <div className="mt-1 space-y-2">{children}</div>
    </div>
  );
}

function PlanEditor({ items, onSaved }: { items: PlanItem[]; onSaved: (item: PlanItem) => void }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <PlanRow key={item.id} item={item} onSaved={onSaved} />
      ))}
    </div>
  );
}

function PlanRow({ item, onSaved }: { item: PlanItem; onSaved: (item: PlanItem) => void }) {
  const [current, setCurrent] = useState(String(item.current));
  const [targetYear, setTargetYear] = useState(String(item.targetYear));
  const [targetLong, setTargetLong] = useState(String(item.targetLong));
  const [message, setMessage] = useState("");

  async function save() {
    setMessage("");
    try {
      const payload = await readJson<{ item: PlanItem }>("/api/audit/plans", {
        method: "PATCH",
        body: JSON.stringify({
          id: item.id,
          current: Number(current),
          targetYear: Number(targetYear),
          targetLong: Number(targetLong),
        }),
      });
      onSaved(payload.item);
      setMessage("저장했습니다.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "저장하지 못했습니다.");
    }
  }

  return (
    <article className="rounded-2xl border border-[#e4ddd2] bg-white p-4">
      <p className="text-xs text-[#8a7044]">{item.code}</p>
      <h3 className="font-medium">{item.title}</h3>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <NumberField label="현재 %" value={current} onChange={setCurrent} />
        <NumberField label="2027 목표" value={targetYear} onChange={setTargetYear} />
        <NumberField label="2030 목표" value={targetLong} onChange={setTargetLong} />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Button onClick={save}>저장</Button>
        {message ? <p className="text-xs text-[#667386]">{message}</p> : null}
      </div>
    </article>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-xs text-[#667386]">
      {label}
      <Input className="mt-1 h-10 bg-white" inputMode="numeric" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function QuestionEditor({ items, onChange }: { items: Question[]; onChange: (items: Question[]) => void }) {
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState("추가");
  const [type, setType] = useState<"scale" | "text">("scale");
  const [message, setMessage] = useState("");

  async function add() {
    setMessage("");
    try {
      const payload = await readJson<{ item: Question }>("/api/audit/questions", {
        method: "POST",
        body: JSON.stringify({ prompt, category, type }),
      });
      onChange([...items, payload.item].sort((a, b) => a.order - b.order));
      setPrompt("");
      setMessage("문항을 추가했습니다.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "추가하지 못했습니다.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#e4ddd2] bg-white p-4">
        <h2 className="font-medium">문항 추가</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-[140px_120px_1fr]">
          <Input className="h-10 bg-white" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="분류" />
          <select className="h-10 rounded-lg border border-input bg-white px-2 text-sm" value={type} onChange={(event) => setType(event.target.value === "text" ? "text" : "scale")}>
            <option value="scale">객관식</option>
            <option value="text">주관식</option>
          </select>
          <Input className="h-10 bg-white" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="문항" />
        </div>
        <Button className="mt-3" onClick={add}>
          추가
        </Button>
        {message ? <p className="mt-2 text-xs text-[#667386]">{message}</p> : null}
      </div>
      {items.map((item) => (
        <QuestionRow
          key={item.id}
          item={item}
          onSaved={(next) => onChange(items.map((question) => (question.id === next.id ? next : question)))}
        />
      ))}
    </div>
  );
}

function QuestionRow({ item, onSaved }: { item: Question; onSaved: (item: Question) => void }) {
  const [prompt, setPrompt] = useState(item.prompt);
  const [active, setActive] = useState(item.active);
  const [message, setMessage] = useState("");

  async function save() {
    setMessage("");
    try {
      const payload = await readJson<{ item: Question }>("/api/audit/questions", {
        method: "PATCH",
        body: JSON.stringify({ id: item.id, prompt, active }),
      });
      onSaved(payload.item);
      setMessage("저장했습니다.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "저장하지 못했습니다.");
    }
  }

  return (
    <article className="rounded-2xl border border-[#e4ddd2] bg-white p-4">
      <p className="text-xs text-[#8a7044]">
        {item.id} · {item.category} · {item.type === "scale" ? "객관식" : "주관식"}
      </p>
      <Textarea className="mt-2 min-h-20 bg-white" value={prompt} onChange={(event) => setPrompt(event.target.value)} />
      <label className="mt-2 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />
        진단표에 사용
      </label>
      <div className="mt-3 flex items-center gap-3">
        <Button onClick={save}>저장</Button>
        {message ? <p className="text-xs text-[#667386]">{message}</p> : null}
      </div>
    </article>
  );
}

function CompanyEditor({
  items,
  onChange,
}: {
  items: Company[];
  onChange: (items: Company[]) => void;
}) {
  const [draft, setDraft] = useState({ name: "", short: "", focus: "", headcount: "0" });

  async function create() {
    const payload = await readJson<{ item: Company }>("/api/audit/companies", {
      method: "PUT",
      body: JSON.stringify({ ...draft, headcount: Number(draft.headcount), create: true }),
    });
    onChange([...items, payload.item]);
    setDraft({ name: "", short: "", focus: "", headcount: "0" });
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <CompanyRow key={item.id} item={item} onSaved={(next) => onChange(items.map((company) => (company.id === next.id ? next : company)))} />
      ))}
      <article className="rounded-2xl border border-dashed border-[#d7d0c4] bg-white p-4">
        <h3 className="font-medium">계열사 추가</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Input className="h-10 bg-white" placeholder="회사명" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
          <Input className="h-10 bg-white" placeholder="짧은 이름" value={draft.short} onChange={(event) => setDraft({ ...draft, short: event.target.value })} />
          <Input className="h-10 bg-white" placeholder="사업" value={draft.focus} onChange={(event) => setDraft({ ...draft, focus: event.target.value })} />
          <Input className="h-10 bg-white" placeholder="대상 인원" value={draft.headcount} onChange={(event) => setDraft({ ...draft, headcount: event.target.value })} />
        </div>
        <Button className="mt-3" onClick={create}>
          추가
        </Button>
      </article>
    </div>
  );
}

function CompanyRow({ item, onSaved }: { item: Company; onSaved: (item: Company) => void }) {
  const [name, setName] = useState(item.name);
  const [short, setShort] = useState(item.short);
  const [focus, setFocus] = useState(item.focus);
  const [headcount, setHeadcount] = useState(String(item.headcount));
  const [message, setMessage] = useState("");

  async function save() {
    setMessage("");
    try {
      const payload = await readJson<{ item: Company }>("/api/audit/companies", {
        method: "PUT",
        body: JSON.stringify({ id: item.id, name, short, focus, headcount: Number(headcount) }),
      });
      onSaved(payload.item);
      setMessage("저장했습니다.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "저장하지 못했습니다.");
    }
  }

  return (
    <article className="rounded-2xl border border-[#e4ddd2] bg-white p-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <Input className="h-10 bg-white" value={name} onChange={(event) => setName(event.target.value)} />
        <Input className="h-10 bg-white" value={short} onChange={(event) => setShort(event.target.value)} />
        <Input className="h-10 bg-white" value={focus} onChange={(event) => setFocus(event.target.value)} />
        <Input className="h-10 bg-white" value={headcount} onChange={(event) => setHeadcount(event.target.value)} />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Button onClick={save}>저장</Button>
        {message ? <p className="text-xs text-[#667386]">{message}</p> : null}
      </div>
    </article>
  );
}

function StaffEditor({
  items,
  companies,
  onChange,
}: {
  items: PublicUser[];
  companies: Company[];
  onChange: (items: PublicUser[]) => void;
}) {
  const [message, setMessage] = useState("");
  const companyName = (id: string) => companies.find((item) => item.id === id)?.name ?? id;

  async function update(id: string, patch: { approved?: boolean; role?: PublicUser["role"] }) {
    setMessage("");
    try {
      const payload = await readJson<{ item: PublicUser }>("/api/audit/users", {
        method: "PATCH",
        body: JSON.stringify({ id, ...patch }),
      });
      onChange(items.map((item) => (item.id === id ? payload.item : item)));
      setMessage("저장했습니다.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "저장하지 못했습니다.");
    }
  }

  async function reject(item: PublicUser) {
    if (!window.confirm(`${item.name}(${item.employeeNo}) 접속 신청을 반려할까요? 신청 기록이 삭제됩니다.`)) return;
    setMessage("");
    try {
      await readJson<{ ok: boolean }>("/api/audit/users", {
        method: "DELETE",
        body: JSON.stringify({ id: item.id }),
      });
      onChange(items.filter((entry) => entry.id !== item.id));
      setMessage("반려했습니다.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "반려하지 못했습니다.");
    }
  }

  if (items.length === 0) {
    return <p className="rounded-2xl border border-dashed border-[#d7d0c4] bg-white p-8 text-sm">등록된 직원이 없습니다.</p>;
  }

  return (
    <div className="space-y-3">
      {message ? <p className="text-sm text-[#667386]">{message}</p> : null}
      {items.map((item) => (
        <article key={item.id} className="rounded-2xl border border-[#e4ddd2] bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium">
                {item.name} · {item.employeeNo}
              </p>
              <p className="mt-1 text-xs leading-5 text-[#667386]">
                {companyName(item.companyId)} · {item.department} · {item.email}
              </p>
              <p className="mt-1 text-xs text-[#8a7044]">
                {item.approved ? "승인됨" : "승인 대기"} · {item.role === "audit" ? "감사팀 관리자" : "일반 직원"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {item.approved ? (
                <Button variant="outline" onClick={() => update(item.id, { approved: false })}>
                  승인 취소
                </Button>
              ) : (
                <>
                  <Button onClick={() => update(item.id, { approved: true })}>승인</Button>
                  <Button variant="outline" onClick={() => reject(item)}>
                    반려
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                onClick={() => update(item.id, { role: item.role === "audit" ? "employee" : "audit" })}
              >
                {item.role === "audit" ? "직원으로" : "감사팀으로"}
              </Button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
