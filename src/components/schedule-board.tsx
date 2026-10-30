"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { periodLabel } from "@/lib/schedule";
import type { ScheduleItem } from "@/lib/types";

type Draft = Omit<ScheduleItem, "id" | "isDefault"> & { id?: string };
const EMPTY: Draft = { start: "", end: "", kind: "교육", title: "", target: "전 임직원", owner: "감사팀", status: "예정" };
const field = "h-10 rounded-lg border border-[#d9d0c2] bg-white px-3 text-sm";

export function ScheduleBoard({ initial, canEdit }: { initial: ScheduleItem[]; canEdit: boolean }) {
  const [items, setItems] = useState(initial);
  const [month, setMonth] = useState("all");
  const [kind, setKind] = useState<"all" | "교육" | "활동">("all");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");

  const months = useMemo(() => [...new Set(items.map((i) => i.start.slice(0, 7)))].sort(), [items]);
  const shown = items.filter((i) => (month === "all" || i.start.startsWith(month)) && (kind === "all" || i.kind === kind));
  const groups = [...new Set(shown.map((i) => i.start.slice(0, 7)))].sort();

  async function reload() {
    const res = await fetch("/api/schedule");
    if (res.ok) setItems(((await res.json()) as { items: ScheduleItem[] }).items);
  }
  async function save() {
    if (!draft) return;
    setError("");
    const res = await fetch("/api/schedule", {
      method: draft.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const payload = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) return setError(payload.error || "저장하지 못했습니다.");
    setDraft(null);
    await reload();
  }
  async function remove(item: ScheduleItem) {
    if (!window.confirm(`'${item.title}' 일정을 삭제할까요?`)) return;
    const res = await fetch(`/api/schedule?id=${encodeURIComponent(item.id)}`, { method: "DELETE" });
    if (!res.ok) return setError(((await res.json().catch(() => ({}))) as { error?: string }).error || "삭제하지 못했습니다.");
    await reload();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-xs tracking-wide text-[#8a7044]">교육 · 공정거래 활동</p>
      <h1 className="mt-2 text-3xl font-semibold">CP 일정표</h1>
      <p className="mt-2 text-sm leading-7 text-[#4d5b6c]">
        직원 대상 교육과 공정거래 자율준수 활동 일정입니다. ‘기본 일정’ 표시는 CP 데스크가 제안한 초기 일정이며 감사팀이 확정·수정합니다.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <select aria-label="월 선택" className={field} value={month} onChange={(e) => setMonth(e.target.value)}>
          <option value="all">전체 월</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {m.replace("-", "년 ")}월
            </option>
          ))}
        </select>
        {(["all", "교육", "활동"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`rounded-full px-3 py-1.5 text-sm ${kind === k ? "bg-[#17283a] text-white" : "border border-[#d9d0c2] text-[#3d4a5c]"}`}
          >
            {k === "all" ? "전체" : k}
          </button>
        ))}
        {canEdit ? (
          <Button className="ml-auto h-10 px-4" onClick={() => setDraft({ ...EMPTY })}>
            일정 추가
          </Button>
        ) : (
          <span className="ml-auto text-xs text-[#667386]">조회 전용 · 일정 수정은 감사팀만 가능합니다</span>
        )}
      </div>

      {draft ? (
        <div className="mt-4 grid gap-2 rounded-2xl border border-[#e4ddd2] bg-white p-4 sm:grid-cols-4">
          <input className={field} type="date" value={draft.start} onChange={(e) => setDraft({ ...draft, start: e.target.value })} aria-label="시작" />
          <input className={field} type="date" value={draft.end} onChange={(e) => setDraft({ ...draft, end: e.target.value })} aria-label="종료(선택)" />
          <select className={field} value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as Draft["kind"] })}>
            <option>교육</option>
            <option>활동</option>
          </select>
          <select className={field} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as Draft["status"] })}>
            <option>예정</option>
            <option>완료</option>
          </select>
          <input className={`${field} sm:col-span-2`} placeholder="내용" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <input className={field} placeholder="대상" value={draft.target} onChange={(e) => setDraft({ ...draft, target: e.target.value })} />
          <input className={field} placeholder="담당" value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} />
          <div className="flex gap-2 sm:col-span-4">
            <Button className="h-10 px-4" onClick={save}>저장</Button>
            <Button className="h-10 px-4" variant="outline" onClick={() => setDraft(null)}>취소</Button>
          </div>
        </div>
      ) : null}
      {error ? <p className="mt-3 text-sm text-[#8d3b32]">{error}</p> : null}

      <div className="mt-6 space-y-6">
        {groups.length === 0 ? <p className="text-sm text-[#667386]">해당 조건의 일정이 없습니다.</p> : null}
        {groups.map((g) => (
          <section key={g}>
            <h2 className="mb-2 text-sm font-semibold text-[#8a7044]">{g.replace("-", "년 ")}월</h2>
            <div className="overflow-x-auto rounded-2xl border border-[#e4ddd2] bg-white">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-[#f6f2ea] text-xs text-[#667386]">
                  <tr>
                    <th className="px-3 py-2 text-left">날짜/기간</th>
                    <th className="px-3 py-2 text-left">구분</th>
                    <th className="px-3 py-2 text-left">내용</th>
                    <th className="px-3 py-2 text-left">대상</th>
                    <th className="px-3 py-2 text-left">담당</th>
                    <th className="px-3 py-2 text-left">상태</th>
                    {canEdit ? <th className="px-3 py-2" /> : null}
                  </tr>
                </thead>
                <tbody>
                  {shown
                    .filter((i) => i.start.startsWith(g))
                    .map((i) => (
                      <tr key={i.id} className="border-t border-[#f0ebe3] align-top">
                        <td className="whitespace-nowrap px-3 py-2">{periodLabel(i)}</td>
                        <td className="px-3 py-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs ${i.kind === "교육" ? "bg-[#e7eef6] text-[#1d3b57]" : "bg-[#f6eedd] text-[#6b5530]"}`}>{i.kind}</span>
                        </td>
                        <td className="px-3 py-2">
                          {i.title}
                          {i.isDefault ? <span className="ml-2 rounded border border-[#d9d0c2] px-1.5 text-[10px] text-[#8a94a3]">기본 일정</span> : null}
                        </td>
                        <td className="px-3 py-2 text-[#4d5b6c]">{i.target}</td>
                        <td className="px-3 py-2 text-[#4d5b6c]">{i.owner}</td>
                        <td className={`px-3 py-2 ${i.status === "완료" ? "text-[#1f6b3a]" : "text-[#7a5d0f]"}`}>{i.status}</td>
                        {canEdit ? (
                          <td className="whitespace-nowrap px-3 py-2 text-right">
                            <button type="button" className="text-xs text-[#1d3b57] underline" onClick={() => setDraft({ ...i })}>수정</button>
                            <button type="button" className="ml-2 text-xs text-[#8d3b32] underline" onClick={() => remove(i)}>삭제</button>
                          </td>
                        ) : null}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
