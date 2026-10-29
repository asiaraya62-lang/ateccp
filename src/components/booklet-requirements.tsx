import Link from "next/link";
import { BOOKLET_REQUIREMENTS, BOOKLET_SOURCE } from "@/lib/booklet";
import type { PlanItem } from "@/lib/types";

export function BookletRequirements({ plans }: { plans: PlanItem[] }) {
  const byId = new Map(plans.map((plan) => [plan.id, plan]));

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">매뉴얼이 요구하는 8가지</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-[#667386]">
          {BOOKLET_SOURCE}가 CP규정에 따라 제시한 도입 요건입니다. 아래 실행 과제는 이 요건을 그룹 일정으로 나눈
          것입니다.
        </p>
      </div>
      <ol className="grid gap-3 sm:grid-cols-2">
        {BOOKLET_REQUIREMENTS.map((item) => {
          const Icon = item.icon;
          const related = item.planIds.map((id) => byId.get(id)).filter((plan) => plan !== undefined);
          return (
            <li key={item.no} className="rounded-2xl border border-[#e4ddd2] bg-white p-5">
              <div className="flex items-start gap-3">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#14283a] text-[#f6f1e6]">
                  <Icon className="size-6" strokeWidth={1.75} aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-xs tracking-wide text-[#8a7044]">{item.no}</p>
                  <h3 className="mt-0.5 text-base font-semibold leading-6">{item.title}</h3>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-[#3d4a5c]">
                {item.points.map((point) => (
                  <li key={point} className="flex gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#9a7b45]" aria-hidden />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              {related.length > 0 ? (
                <p className="mt-4 flex flex-wrap gap-2">
                  {related.map((plan) => (
                    <Link
                      key={plan.id}
                      href={`/plans/${plan.id}`}
                      className="rounded-full border border-[#e4ddd2] bg-[#fbfaf7] px-2.5 py-1 text-xs text-[#1d3b57] hover:border-[#9a7b45]"
                    >
                      {plan.code} {plan.title}
                    </Link>
                  ))}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
