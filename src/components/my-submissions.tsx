import { seoulStamp } from "@/lib/period";
import type { Submission } from "@/lib/types";

export function MySubmissions({ items }: { items: Submission[] }) {
  return (
    <section className="mx-auto max-w-3xl px-4 pt-8">
      <h2 className="text-lg font-semibold">내가 제출한 자가진단</h2>
      {items.length === 0 ? (
        <p className="mt-2 text-sm leading-6 text-[#667386]">이 계정으로 제출한 기록이 없습니다.</p>
      ) : (
        <ul className="mt-3 overflow-hidden rounded-2xl border border-[#e4ddd2] bg-white">
          {items.map((item) => (
            <li key={item.id} className="border-b border-[#f3eee6] px-4 py-3 last:border-0">
              <p className="text-sm font-medium">
                {item.period} · {item.reason === "monthly" ? "월례" : "감사팀 요청"} ·{" "}
                {item.score === null ? "점수 없음" : `${item.score}점`}
              </p>
              <p className="mt-1 text-xs text-[#667386]">
                {item.id} · {seoulStamp(new Date(item.submittedAt))}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
