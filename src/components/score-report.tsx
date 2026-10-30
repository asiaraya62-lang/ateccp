"use client";

import type { ScoreResult } from "@/lib/scale";
import { scaleLabel } from "@/lib/scale";

const BAND_TONE: Record<string, string> = {
  양호: "bg-[#e8f4ec] text-[#1f6b3a] border-[#bfe0ca]",
  안정: "bg-[#eef5ea] text-[#3b6b1f] border-[#cfe3c0]",
  관심: "bg-[#fdf8e6] text-[#7a5d0f] border-[#efe0a8]",
  주의: "bg-[#fff3e6] text-[#8a4b0f] border-[#f2d2a9]",
  경고: "bg-[#fdeee9] text-[#8d3b32] border-[#efc8bd]",
  위험: "bg-[#fbe4e1] text-[#8d1f1f] border-[#e8aaa3]",
};

type Props = Pick<ScoreResult, "score" | "categories" | "band" | "redFlags" | "infoExchange"> & { compact?: boolean };

export function ScoreReport({ score, categories, band, redFlags, infoExchange, compact = false }: Props) {
  const ordered = [...categories].sort((a, b) => (a.category === "담합" ? -1 : b.category === "담합" ? 1 : b.weight - a.weight));
  const ixFlag = redFlags.find((f) => f.id === "RF8");
  return (
    <div className="space-y-4" data-testid="score-report">
      <div className="flex flex-wrap items-center gap-3">
        <div className="rounded-2xl border border-[#e4ddd2] bg-white px-5 py-3">
          <p className="text-xs text-[#667386]">준수 점수(가중 100점)</p>
          <p className="text-3xl font-semibold">{score === null ? "–" : score}</p>
        </div>
        {band ? (
          <div className={`rounded-2xl border px-5 py-3 ${BAND_TONE[band.band] ?? ""}`}>
            <p className="text-xs">위험등급(자체 기준)</p>
            <p className="text-xl font-semibold">{band.band}</p>
            <p className="text-xs">{band.action}</p>
          </div>
        ) : null}
      </div>

      <div className={`rounded-2xl border-2 p-4 ${ixFlag ? "border-[#c0392b] bg-[#fff4f2]" : "border-[#1d3b57] bg-[#f4f7fa]"}`}>
        <p className="text-sm font-semibold">★ 정보교환 담합 점검 {infoExchange.score === null ? "" : `· ${infoExchange.score}점`}</p>
        <p className="mt-1 text-xs leading-5 text-[#4d5b6c]">
          경쟁사와 가격·원가·물량·입찰 정보를 직접 또는 고객사·협회를 거쳐 주고받는 것도 담합입니다(공정거래법 제40조①9호 후단).
        </p>
        {ixFlag ? (
          <p className="mt-2 text-sm font-medium text-[#8d1f1f]">
            위험 응답 {ixFlag.questions.length}개 → {ixFlag.action}
          </p>
        ) : (
          <p className="mt-2 text-sm text-[#1f6b3a]">위험 응답 없음</p>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#e4ddd2] bg-white">
        <table className="w-full text-sm">
          <thead className="bg-[#f6f2ea] text-xs text-[#667386]">
            <tr>
              <th className="px-3 py-2 text-left">분야</th>
              <th className="px-3 py-2 text-right">가중치</th>
              <th className="px-3 py-2 text-right">점수</th>
              <th className="px-3 py-2 text-right">응답/해당없음</th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((c) => (
              <tr key={c.category} className={`border-t border-[#f0ebe3] ${c.category === "담합" ? "bg-[#fffaf0] font-semibold" : ""}`}>
                <td className="px-3 py-2">{c.category === "담합" ? "★ 담합" : c.category}</td>
                <td className="px-3 py-2 text-right">{c.weight}</td>
                <td className={`px-3 py-2 text-right ${c.score !== null && c.score < 55 ? "text-[#8d3b32]" : ""}`}>{c.score === null ? "제외" : c.score}</td>
                <td className="px-3 py-2 text-right text-[#667386]">
                  {c.answered}/{c.notApplicable}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="text-sm font-semibold">레드플래그 {redFlags.length ? `${redFlags.length}건` : "없음"}</h3>
        <ul className="mt-2 space-y-2">
          {redFlags.map((flag, index) => (
            <li
              key={`${flag.id}-${index}`}
              className={`rounded-xl border p-3 text-sm ${flag.level === "critical" ? "border-[#e8aaa3] bg-[#fbe4e1]" : "border-[#f2d2a9] bg-[#fff3e6]"}`}
            >
              <p className="font-medium">
                {flag.level === "critical" ? "🔴" : "🟡"} {flag.id} {flag.title}
              </p>
              <p className="text-xs">{flag.action}</p>
              {!compact && flag.questions.length ? (
                <ul className="mt-1 list-disc pl-5 text-xs leading-5">
                  {flag.questions.map((q) => (
                    <li key={q.questionId}>
                      {q.prompt} ({scaleLabel(q.value)})
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-[#8a94a3]">
        점수 기준: 응답 5→100·4→75·3→50·2→25·1→0, 해당 업무 없음은 계산 제외, 위험도별 문항 가중치(상3·중2·하1)와 분야 가중치 적용. 위험등급은 공정위 CP 등급 구간을 준용한 자체 기준입니다.
      </p>
    </div>
  );
}
