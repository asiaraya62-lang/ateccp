import Link from "next/link";
import { BookletRequirements } from "@/components/booklet-requirements";
import { GoalBar } from "@/components/goal-bar";
import type { Overview } from "@/lib/types";

export function PlanIndex({ data }: { data: Overview }) {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:py-10">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight">실행 과제</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[#5c6b7c]">
          과제 {data.plans.length}개의 가중 달성률은 {data.overall.current}%입니다. {data.horizon.near}년 목표는{" "}
          {data.overall.target}%, {data.horizon.long}년 목표는 {data.overall.longTarget}%입니다. 과제 이름을 누르면
          그 과제의 상세 내역이 열립니다. 수치는 감사팀이 관리하는 내부 진척입니다.
        </p>
      </section>

      <BookletRequirements plans={data.plans} />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">과제별 달성률</h2>

      {data.plans.length === 0 ? (
        <p className="rounded-2xl border border-[#e4ddd2] bg-white p-6 text-sm text-[#5c6b7c]">
          등록된 실행 과제가 없습니다.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#e4ddd2] bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-[#eee7dc] text-xs text-[#667386]">
              <tr>
                <th className="px-4 py-3 font-medium">코드</th>
                <th className="px-4 py-3 font-medium">실행 과제</th>
                <th className="px-4 py-3 font-medium">주관</th>
                <th className="px-4 py-3 font-medium">현재</th>
                <th className="px-4 py-3 font-medium">{data.horizon.near}</th>
                <th className="px-4 py-3 font-medium">{data.horizon.long}</th>
                <th className="px-4 py-3 font-medium">진척</th>
              </tr>
            </thead>
            <tbody>
              {data.plans.map((plan) => (
                <tr key={plan.id} className="border-b border-[#f3eee6] last:border-0">
                  <td className="px-4 py-3 align-top font-mono text-xs text-[#8a7044]">{plan.code}</td>
                  <td className="px-4 py-3 align-top">
                    <Link
                      href={`/plans/${plan.id}`}
                      className="font-medium text-[#1d3b57] underline decoration-[#d9c7a2] underline-offset-4"
                    >
                      {plan.title}
                    </Link>
                    <p className="mt-1 text-xs leading-5 text-[#667386]">{plan.detail}</p>
                  </td>
                  <td className="px-4 py-3 align-top text-[#4d5b6c]">{plan.owner}</td>
                  <td className="px-4 py-3 align-top font-semibold tabular-nums">{plan.current}%</td>
                  <td className="px-4 py-3 align-top tabular-nums">{plan.targetYear}%</td>
                  <td className="px-4 py-3 align-top tabular-nums">{plan.targetLong}%</td>
                  <td className="w-40 px-4 py-3 align-top">
                    <GoalBar current={plan.current} target={plan.targetYear} showLegend={false} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </section>
    </div>
  );
}
