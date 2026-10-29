import Link from "next/link";
import { GoalBar } from "@/components/goal-bar";
import { bookletRequirementFor } from "@/lib/booklet";
import { planGapCopy } from "@/lib/plan-copy";
import type { Overview, PlanItem } from "@/lib/types";

export function PlanDetail({ data, plan }: { data: Overview; plan: PlanItem }) {
  const domain = data.domains.find((item) => item.id === plan.domain);
  const weight = data.plans.reduce((sum, item) => sum + item.weight, 0);
  const siblings = data.plans.filter((item) => item.domain === plan.domain && item.id !== plan.id);
  const share = weight > 0 ? Math.round((plan.weight / weight) * 1000) / 10 : 0;
  const requirement = bookletRequirementFor(plan.id);
  const RequirementIcon = requirement?.icon;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:py-10">
      <p className="text-sm text-[#667386]">
        <Link href="/" className="hover:text-[#172233]">
          도입 현황
        </Link>
        <span className="px-1.5">/</span>
        <Link href="/plans" className="hover:text-[#172233]">
          실행 과제
        </Link>
        <span className="px-1.5">/</span>
        <span className="text-[#172233]">{plan.code}</span>
      </p>

      <header>
        <p className="font-mono text-xs tracking-wide text-[#8a7044]">
          {domain ? `${domain.roman} ${domain.name}` : plan.domain} · {plan.code}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{plan.title}</h1>
        <p className="mt-3 text-sm text-[#5c6b7c]">{planGapCopy(plan, data.horizon.near, data.horizon.long)}</p>
      </header>

      {requirement && RequirementIcon ? (
        <section className="rounded-2xl border border-[#e4ddd2] bg-white p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#14283a] text-[#f6f1e6]">
              <RequirementIcon className="size-5" strokeWidth={1.75} aria-hidden />
            </span>
            <div>
              <h2 className="text-sm font-medium text-[#8a7044]">{`매뉴얼 요건 ${requirement.no}`}</h2>
              <p className="mt-1 font-semibold">{requirement.title}</p>
            </div>
          </div>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-[#3d4a5c]">
            {requirement.points.map((point) => (
              <li key={point} className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#9a7b45]" aria-hidden />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-2xl border border-[#e4ddd2] bg-white p-5 sm:p-6">
        <h2 className="text-sm font-medium text-[#8a7044]">해야 할 일</h2>
        <p className="mt-2 text-base leading-7">{plan.detail}</p>
        {domain ? <p className="mt-4 text-sm leading-6 text-[#5c6b7c]">운영 축은 {domain.name}입니다. {domain.blurb}.</p> : null}
      </section>

      <section className="rounded-2xl border border-[#e4ddd2] bg-white p-5 sm:p-6">
        <h2 className="text-sm font-medium text-[#8a7044]">달성률</h2>
        <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
          {[
            ["현재", `${plan.current}%`],
            [`${data.horizon.near}년`, `${plan.targetYear}%`],
            [`${data.horizon.long}년`, `${plan.targetLong}%`],
          ].map(([label, value]) => (
            <div key={label} className="border-t border-[#eee7dc] pt-3">
              <dt className="text-[11px] text-[#667386]">{label}</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5">
          <GoalBar current={plan.current} target={plan.targetYear} longTarget={plan.targetLong} />
        </div>
        <p className="mt-4 text-sm leading-6 text-[#5c6b7c]">
          가중치 {plan.weight}
          {weight > 0 ? `입니다. 전체 가중치 ${weight} 가운데 ${share}%가 이 과제에 실립니다.` : "입니다."} 수치는
          감사팀 화면에서 고칩니다.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-2xl border border-[#e4ddd2] bg-white p-5">
          <h2 className="text-sm font-medium text-[#8a7044]">주관</h2>
          <p className="mt-2 text-lg font-semibold">{plan.owner}</p>
        </article>
        <article className="rounded-2xl border border-[#e4ddd2] bg-white p-5">
          <h2 className="text-sm font-medium text-[#8a7044]">같은 운영 축</h2>
          <p className="mt-2 text-lg font-semibold">{domain ? `${domain.name} ${domain.current}%` : plan.domain}</p>
          <p className="mt-1 text-sm text-[#667386]">
            {data.horizon.near}년 {domain?.target ?? "—"}% · 과제 {domain?.itemCount ?? 0}개
          </p>
        </article>
      </section>

      {siblings.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold">이 축의 다른 과제</h2>
          <ul className="mt-3 overflow-hidden rounded-2xl border border-[#e4ddd2] bg-white">
            {siblings.map((item) => (
              <li key={item.id} className="border-b border-[#f3eee6] last:border-0">
                <Link href={`/plans/${item.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[#fbfaf7]">
                  <span>
                    <span className="mr-2 font-mono text-xs text-[#8a7044]">{item.code}</span>
                    <span className="font-medium">{item.title}</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-sm font-semibold">{item.current}%</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p>
        <Link href="/plans" className="text-sm text-[#1d3b57] underline-offset-4 hover:underline">
          실행 과제 목록
        </Link>
      </p>
    </div>
  );
}
