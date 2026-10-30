import { periodLabel } from "@/lib/schedule";
import type { ScheduleItem } from "@/lib/types";
import Link from "next/link";
import { GoalBar } from "@/components/goal-bar";
import type { Overview } from "@/lib/types";

export function Dashboard({ data, upcoming = [] }: { data: Overview; upcoming?: ScheduleItem[] }) {
  const gap = data.overall.target - data.overall.current;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:py-10">
      <section className="overflow-hidden rounded-2xl border border-[#d7d0c4] bg-[#14283a] text-white">
        <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
          <div className="p-6 sm:p-10">
            <p className="text-[11px] tracking-[0.2em] text-[#d9c7a2]">FAIR TRADE COMPLIANCE PROGRAM</p>
            <h1 className="mt-4 text-[2rem] font-semibold leading-[1.25] sm:text-4xl">
              공정거래 자율준수를
              <br />
              계열사가 함께 운영합니다
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/75">
              지금은 등급이 없는 도입 단계입니다. {data.periodLabel}부터 구성원은 월 1회 본인 자가진단을
              제출하고, 그룹은 2027년 실적을 쌓아 2028년 등급평가를 준비합니다.
            </p>
            <dl className="mt-8 grid grid-cols-3 gap-3 text-sm">
              {[
                ["현재 등급", "없음"],
                ["2028년 목표", "A"],
                ["2030년 목표", "AA"],
              ].map(([label, value]) => (
                <div key={label} className="border-t border-white/15 pt-3">
                  <dt className="text-[11px] text-white/55">{label}</dt>
                  <dd className="mt-1 text-lg font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="bg-[#fbfaf7] p-6 text-[#1c2838] sm:p-10">
            <p className="text-xs tracking-wide text-[#8a7044]">내부 실행 달성률</p>
            <p className="mt-2 text-6xl font-semibold tabular-nums tracking-tight">{data.overall.current}%</p>
            <p className="mt-2 text-sm text-[#5c6b7e]">
              {data.horizon.near}년 목표 {data.overall.target}% · {data.horizon.long}년 목표{" "}
              {data.overall.longTarget}%
            </p>
            <div className="mt-5">
              <GoalBar
                current={data.overall.current}
                target={data.overall.target}
                longTarget={data.overall.longTarget}
              />
            </div>
            <p className="mt-4 text-sm leading-6 text-[#5c6b7e]">
              가까운 목표까지 {gap}%p 남아 있습니다. 가중치는 실행 과제 15개의 중요도를 반영합니다.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#e4ddd2] bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="text-xs tracking-wide text-[#8a7044]">교육 · 공정거래 활동</p>
            <h2 className="mt-1 text-2xl font-semibold">다가오는 일정</h2>
          </div>
          <Link href="/schedule" className="text-sm text-[#1d3b57] underline">전체 일정표</Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="mt-3 text-sm text-[#667386]">예정된 일정이 없습니다.</p>
        ) : (
          <ul className="mt-4 divide-y divide-[#f0ebe3] text-sm">
            {upcoming.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-3 py-2.5">
                <span className="w-40 shrink-0 text-[#4d5b6c]">{periodLabel(item)}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${item.kind === "교육" ? "bg-[#e7eef6] text-[#1d3b57]" : "bg-[#f6eedd] text-[#6b5530]"}`}>{item.kind}</span>
                <span className="min-w-0 flex-1 font-medium">{item.title}</span>
                <span className="text-xs text-[#667386]">{item.target}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="personal" className="grid gap-4 rounded-2xl border border-[#e0c48a] bg-[#fffaf1] p-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-8">
        <div>
          <p className="text-xs tracking-wide text-[#8a7044]">개인평가</p>
          <h2 className="mt-1 text-2xl font-semibold">본인 자가진단</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[#4d5b6c]">
            {data.periodLabel} 마감까지 {data.daysLeft}일. 전 계열사 구성원은 매월 1회 제출합니다. 감사팀이
            요청하면 같은 달에도 추가로 제출합니다. 객관식 {data.scaleCount}문항, 주관식 {data.textCount}
            문항, 불만 사항과 개선 사항을 입력하면 담당자에게 메일로 전달됩니다.
          </p>
        </div>
        <Link
          href="/diagnosis"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground"
        >
          자가진단 작성
        </Link>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">네 가지 운영 축</h2>
            <p className="mt-1 text-sm text-[#667386]">2025년 등급평가 가이드라인의 대분류를 그룹 실행 과제로 묶었습니다.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {data.domains.map((domain) => (
            <article key={domain.id} className="rounded-2xl border border-[#e4ddd2] bg-white p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-base font-semibold">
                  <span className="mr-2 text-[#8a7044]">{domain.roman}</span>
                  {domain.name}
                </h3>
                <p className="text-2xl font-semibold tabular-nums">{domain.current}%</p>
              </div>
              <p className="mt-1 text-sm text-[#667386]">{domain.blurb}</p>
              <div className="mt-4">
                <GoalBar current={domain.current} target={domain.target} longTarget={domain.longTarget} />
              </div>
              <p className="mt-3 text-xs text-[#667386]">
                {data.horizon.near}년 {domain.target}% · {data.horizon.long}년 {domain.longTarget}% ·{" "}
                <Link href="/plans" className="text-[#1d3b57] underline decoration-[#d9c7a2] underline-offset-4">
                  과제 {domain.itemCount}개
                </Link>
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-[#e4ddd2] bg-white p-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-8">
        <div>
          <h2 className="text-xl font-semibold">실행 과제</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[#4d5b6c]">
            과제 {data.plans.length}개의 코드, 주관, 현재 진척과 {data.horizon.near}년·{data.horizon.long}년 목표는
            실행 과제 화면에 있습니다. 지금 가중 달성률은 {data.overall.current}%입니다.
          </p>
        </div>
        <Link
          href="/plans"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground"
        >
          실행 과제 보기
        </Link>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">{data.periodLabel} 계열사 제출률</h2>
          <p className="mt-1 text-sm text-[#667386]">
            목표 제출률은 전원 100%입니다. 이번 달 제출 {data.monthSubmissionCount}건, 인원은 같은 사번의 중복을 제외했습니다.
            대상 인원은 감사팀이 관리하는 참여 기준입니다.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.companies.map((company) => (
            <article key={company.id} className="rounded-2xl border border-[#e4ddd2] bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{company.name}</h3>
                  <p className="text-xs text-[#667386]">{company.focus}</p>
                </div>
                <p className="text-2xl font-semibold tabular-nums">{company.rate}%</p>
              </div>
              <div className="mt-4">
                <GoalBar current={company.rate} target={100} />
              </div>
              <p className="mt-3 text-xs text-[#667386]">
                제출 {company.submitted}명 / 대상 {company.headcount}명 · 목표 100%
              </p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">중장기 등급 경로</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-[#667386]">
          등급평가의 대상기간은 신청 직전년도 1월 1일부터 12월 31일까지입니다. 2026년 4분기에 기반을 만들면
          첫 실적 연도는 2027년이고, 신청은 2028년이 됩니다.
        </p>
        <ol className="mt-4 grid gap-3 md:grid-cols-4">
          {data.roadmap.map((step) => (
            <li
              key={step.year}
              className={`rounded-2xl border p-4 ${
                step.state === "now" ? "border-[#1d3b57] bg-[#17283a] text-white" : "border-[#e4ddd2] bg-white"
              }`}
            >
              <p className={`text-xs ${step.state === "now" ? "text-[#d9c7a2]" : "text-[#8a7044]"}`}>
                {step.state === "now" ? "지금" : "다음"} · {step.year}
              </p>
              <p className="mt-2 font-semibold">{step.title}</p>
              <p className={`mt-2 text-sm leading-6 ${step.state === "now" ? "text-white/75" : "text-[#5c6b7e]"}`}>
                {step.detail}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
