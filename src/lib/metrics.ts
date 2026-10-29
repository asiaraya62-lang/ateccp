import type { Company, PlanItem, Submission } from "./types";

export const DOMAINS = [
  {
    id: "C" as const,
    roman: "Ⅰ",
    name: "구축",
    blurb: "경영진의 의지, 운영 기준, 전담 조직",
  },
  {
    id: "D" as const,
    roman: "Ⅱ",
    name: "기준·교육",
    blurb: "자율준수편람과 임직원 교육",
  },
  {
    id: "O" as const,
    roman: "Ⅲ",
    name: "운영·감시",
    blurb: "위험평가, 사전협의, 신고와 제재",
  },
  {
    id: "E" as const,
    roman: "Ⅳ",
    name: "평가·개선",
    blurb: "자가진단, 감사, 효과성 평가",
  },
];

export const HORIZON = { near: "2027", long: "2030" };

export const ROADMAP = [
  {
    year: "2026년 4분기",
    title: "기반 구축",
    detail: "도입 선포, 관리자 임명, 규정 초안, 월례 자가진단을 시작한다.",
    state: "now" as const,
  },
  {
    year: "2027년",
    title: "실적 연도",
    detail: "편람과 교육, 위험평가, 사전협의, 내부감사를 한 해 동안 운영한다.",
    state: "next" as const,
  },
  {
    year: "2028년",
    title: "최초 등급평가",
    detail: "2027년 실적으로 등급평가를 신청한다. 목표 등급은 A이다.",
    state: "next" as const,
  },
  {
    year: "2030년",
    title: "중견 CP 체계",
    detail: "계열사가 같은 기준으로 운영하고, 목표 등급은 AA이다.",
    state: "next" as const,
  },
];

function weighted(items: PlanItem[], key: "current" | "targetYear" | "targetLong") {
  const weight = items.reduce((sum, item) => sum + item.weight, 0);
  if (weight === 0) return 0;
  const value = items.reduce((sum, item) => sum + item[key] * item.weight, 0);
  return Math.round(value / weight);
}

export function rollupPlans(items: PlanItem[]) {
  const domains = DOMAINS.map((domain) => {
    const group = items.filter((item) => item.domain === domain.id);
    return {
      ...domain,
      current: weighted(group, "current"),
      target: weighted(group, "targetYear"),
      longTarget: weighted(group, "targetLong"),
      itemCount: group.length,
    };
  });
  return {
    domains,
    overall: {
      current: weighted(items, "current"),
      target: weighted(items, "targetYear"),
      longTarget: weighted(items, "targetLong"),
    },
  };
}

export function participation(companies: Company[], submissions: Submission[], period: string) {
  return companies.map((company) => {
    const people = new Set(
      submissions
        .filter((item) => item.period === period && item.companyId === company.id)
        .map((item) => item.employeeNo.trim()),
    );
    const submitted = people.size;
    const raw = company.headcount > 0 ? (submitted / company.headcount) * 100 : 0;
    const rate = raw > 0 && raw < 1 ? 1 : Math.min(100, Math.round(raw));
    return { ...company, submitted, rate };
  });
}
