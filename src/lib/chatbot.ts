import { DOMAINS, HORIZON, ROADMAP, rollupPlans } from "./metrics";
import { seoulParts } from "./period";
import { SCALE } from "./scale";
import type { PlanItem, Question, ScheduleItem } from "./types";
import { periodLabel, upcoming } from "./schedule";

export type Urgency = "red" | "yellow" | "green";
export type TaskSignal = {
  code: string;
  title: string;
  owner: string;
  domain: string;
  current: number;
  target: number;
  expected: number;
  gap: number;
  deadline: string;
  monthlyNeeded: number;
  status: Urgency;
  label: string;
};

// 실적 연도(2027년) 말까지 연간 목표를 채워야 2028년 최초 등급평가(목표 A) 신청이 가능하다.
const START = Date.UTC(2026, 9, 1); // 2026-10-01 기반 구축 시작
const YEAR_DEADLINE = Date.UTC(2027, 11, 31);
export const DEADLINE_LABEL = "2027-12-31";
export const LONG_DEADLINE_LABEL = "2030-12-31";

export const GRADE_NOTE =
  "공정거래 관련 법위반(과징금·조사방해 과태료·고발)이 있으면 평가점수에서 5점 감점돼요(최초 신청 기업은 제외). 근거: 공정거래 자율준수제도(CP) 운영·평가에 관한 규정(공정위 고시 제2025-3호).";

export const GRADES = [
  { grade: "AAA", text: "최우수 (90점 이상 100점 미만)" },
  { grade: "AA", text: "우수 (80점 이상 90점 미만) – 에이텍그룹 2030년 목표" },
  { grade: "A", text: "비교적 우수 (70점 이상 80점 미만) – 에이텍그룹 2028년 최초 평가 목표" },
  { grade: "미지정", text: "70점 미만 – CP 우수기업 미지정 (2025.4.23 고시 개정으로 B·C·D 등급 폐지)" },
];

function todayUtc() {
  const { year, month, day } = seoulParts();
  return Date.UTC(year, month - 1, day);
}

export function computeSignals(plans: PlanItem[]): TaskSignal[] {
  const now = todayUtc();
  const ratio = Math.min(1, Math.max(0, (now - START) / (YEAR_DEADLINE - START)));
  const monthsLeft = Math.max(1, (YEAR_DEADLINE - now) / (30.4 * 86400000));
  return plans
    .map((p) => {
      const expected = Math.round(p.targetYear * ratio);
      const gap = expected - p.current;
      const remaining = Math.max(0, p.targetYear - p.current);
      const monthlyNeeded = Math.round((remaining / monthsLeft) * 10) / 10;
      let status: Urgency = "green";
      if (remaining > 0 && (gap >= 10 || (p.current === 0 && p.weight >= 6) || monthlyNeeded >= 7)) status = "red";
      else if (remaining > 0 && (gap > 0 || monthlyNeeded >= 5)) status = "yellow";
      const domain = DOMAINS.find((d) => d.id === p.domain)?.name ?? p.domain;
      return {
        code: p.code,
        title: p.title,
        owner: p.owner,
        domain,
        current: p.current,
        target: p.targetYear,
        expected,
        gap,
        deadline: DEADLINE_LABEL,
        monthlyNeeded,
        status,
        label: status === "red" ? "🔴 긴급" : status === "yellow" ? "🟡 주의" : "🟢 양호",
      };
    })
    .sort((a, b) => {
      const rank = { red: 0, yellow: 1, green: 2 };
      return rank[a.status] - rank[b.status] || b.gap - a.gap;
    });
}

export function buildContext(plans: PlanItem[], questions: Question[], schedule: ScheduleItem[] = []) {
  const signals = computeSignals(plans);
  const rolled = rollupPlans(plans);
  const { year, month, day } = seoulParts();
  return {
    today: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    overall: rolled.overall,
    domains: rolled.domains.map((d) => ({ name: d.name, blurb: d.blurb, current: d.current, target: d.target })),
    roadmap: ROADMAP,
    horizon: HORIZON,
    grades: GRADES,
    schedule: upcoming(schedule, 8).map((s) => ({ when: periodLabel(s), kind: s.kind, title: s.title, target: s.target, owner: s.owner })),
    gradeNote: GRADE_NOTE,
    signals,
    scale: SCALE,
    questionCategories: Array.from(new Set(questions.map((q) => q.category))),
    questions: questions.map((q) => ({ id: q.id, category: q.category, prompt: q.prompt, type: q.type })),
  };
}

export type BotContext = ReturnType<typeof buildContext>;

export function signalSummary(ctx: BotContext, limit = 6) {
  const red = ctx.signals.filter((s) => s.status === "red");
  const yellow = ctx.signals.filter((s) => s.status === "yellow");
  const green = ctx.signals.filter((s) => s.status === "green");
  const lines = [
    `전체 진척률 ${ctx.overall.current}% / 2027년 목표 ${ctx.overall.target}% (오늘 ${ctx.today} 기준)`,
    `긴급 ${red.length}건 · 주의 ${yellow.length}건 · 양호 ${green.length}건`,
    "",
    ...[...red, ...yellow].slice(0, limit).map(
      (s) => `${s.label} ${s.code} ${s.title} (${s.owner}) – 현재 ${s.current}% → 목표 ${s.target}%, 지금쯤 ${s.expected}%여야 함, 매월 +${s.monthlyNeeded}%p 필요`,
    ),
  ];
  return lines.join("\n");
}

const FAQ: { keys: string[]; answer: (ctx: BotContext) => string }[] = [
  {
    keys: ["cp", "자율준수", "공정거래 자율", "무엇", "뭐야", "뭔가요", "뭐예요"],
    answer: () =>
      "CP(Compliance Program, 공정거래 자율준수프로그램)는 회사가 스스로 공정거래 법규를 지키기 위해 만든 내부 준법 시스템이에요. 경영진의 의지 공표, 운영 규정, 자율준수관리자, 교육, 위험 감시, 자가진단·감사 같은 장치로 구성되고, 공정거래위원회가 운영 실적을 평가해 등급을 줘요. 좋은 등급을 받으면 법 위반 시 과징금 감경 같은 혜택이 있어요.",
  },
  {
    keys: ["자가진단", "어떻게", "방법", "하는 법", "작성"],
    answer: (ctx) =>
      `자가진단은 매월 1회, 본인 업무를 기준으로 답하면 돼요.\n1) 상단 '자가진단' 메뉴로 들어가요.\n2) 객관식 ${ctx.questions.filter((q) => q.type === "scale").length}문항은 5단계(항상 지킨다 ~ 지키지 않는다) 중 하나를 고르고, 내 업무와 관계없으면 '해당 업무 없음'을 골라요.\n3) 주관식은 상황만 간단히 적으면 되고, 비워도 돼요.\n4) 제출하면 감사팀에 전달돼요. 정답을 맞히는 시험이 아니니 솔직하게 답하는 게 가장 중요해요.`,
  },
  {
    keys: ["해당 업무 없음", "해당없음", "na", "관계없"],
    answer: () =>
      "그 문항의 상황이 내 업무에서 아예 일어나지 않으면 '해당 업무 없음'을 고르세요. 예를 들어 입찰 업무를 하지 않는 직원은 입찰 문항에 이 선택지를 쓰면 돼요. 점수 계산에서 빠지므로 불이익이 없어요.",
  },
  {
    keys: ["점수", "낮게", "솔직", "불이익", "1점", "2점"],
    answer: () =>
      "자가진단은 개인 평가가 아니라 회사의 위험 지점을 찾는 도구예요. '잘 지키지 못한다'나 '지키지 않는다'를 고른 문항은 감사팀이 교육·제도 개선 포인트로 활용하고, 솔직한 응답 때문에 불이익을 주지 않아요.",
  },
  {
    keys: ["정보교환", "정보 교환", "민감", "허브", "고객사를 통해", "가격 정보", "견적 정보"],
    answer: () =>
      "정보교환 담합은 경쟁사와 가격·원가·생산량·재고·판매량·거래조건 같은 '경쟁상 민감한 정보'를 주고받기로 하는 것만으로도 성립하는 담합이에요(공정거래법 제40조①9호 후단, 2021.12.30 시행).\n• 직접이 아니어도 위험해요: 고객사·거래처·협회를 거쳐 경쟁사 가격을 듣거나 우리 가격이 전달되게 하는 것도 포함돼요.\n• 고객사와 우리 회사 가격을 협상하는 건 정상이지만, \"B사는 얼마 넣었어요?\"라고 묻거나 전달을 부탁하면 안 돼요.\n• 경쟁사 정보를 받으면 열지 말고 '받지 않겠다'고 회신한 뒤 감사팀에 알리세요. 공정위 심사지침상 수신 거부·신고 시점부터 합의에서 빠진 것으로 볼 수 있어요.\n• 모임에서 가격 얘기가 나오면 반대 의사를 밝히고 나와 기록을 남기세요.\n자가진단의 '정보교환 주의' 문항에 2점 이하로 답하면 감사팀 즉시 점검과 법무검토, 교육 안내가 진행돼요.",
  },
  {
    keys: ["담합"],
    answer: () =>
      "담합(부당한 공동행위)은 경쟁사끼리 가격, 물량, 납기, 시장, 입찰 여부를 미리 맞추는 행위예요. 말로만 합의해도 성립하고, 업계 모임이나 메신저 대화도 증거가 돼요. 경쟁사와 이런 이야기가 나오면 자리를 피하고 기록을 남긴 뒤 감사팀에 알리세요.",
  },
  {
    keys: ["입찰", "들러리"],
    answer: () =>
      "입찰 문항은 공공·금융·교통기관 입찰에서 예정가격이나 타사 투찰 정보를 알아내지 않는지, 들러리 참여나 낙찰 나눠먹기를 하지 않는지, 서류를 사실대로 쓰는지를 묻는 거예요. 입찰 업무가 없으면 '해당 업무 없음'을 고르세요.",
  },
  {
    keys: ["하도급", "수급사업자", "협력사", "기술자료"],
    answer: () =>
      "하도급 문항은 협력사(수급사업자)에게 대금 지연·부당 감액·발주 취소·기술자료 유용·구입 강요를 하지 않는지, 계약서를 작업 전에 주는지를 묻는 거예요. 협력사에 일을 맡기는 직원이 대상이에요.",
  },
  {
    keys: ["계열", "일감"],
    answer: () =>
      "계열거래 문항은 계열사와 거래할 때 비계열사와 같은 기준(가격 비교, 계약·검수 절차)을 지키는지, 일감 몰아주기나 손실 떠넘기기를 하지 않는지를 묻는 거예요.",
  },
  {
    keys: ["거래상지위", "갑질", "우월", "지위"],
    answer: () =>
      "거래상 지위 남용은 대리점·유지보수·유통 거래에서 우리 회사가 강한 위치를 이용해 판촉비 전가, 구입 강요, 부당한 거래 거절 같은 일방적인 조건을 요구하는 행위예요.",
  },
  {
    keys: ["표시", "광고", "과장"],
    answer: () =>
      "표시광고 문항은 제안서·카탈로그·홈페이지에 성능, 인증, 점유율, 실적을 사실과 다르게 쓰거나 과장하지 않는지를 묻는 거예요. 근거 자료가 있는 표현만 쓰면 돼요.",
  },
  {
    keys: ["신고", "제보", "기록"],
    answer: () =>
      "공정거래 위반이 의심되면 감사팀 채널로 알릴 수 있고, 신고자의 신원은 보호돼요. 신고기록 문항은 이런 채널을 알고 있는지, 거래 관련 메일·메신저 내용을 지우지 않고 계약·품의에 남기는지를 묻는 거예요.",
  },
];

function gradeAnswer(ctx: BotContext, text: string) {
  const wantsAA = /aa|2030|우수/i.test(text) && !/\bA\b등급|A 등급/.test(text);
  const head = ctx.grades.map((g) => `• ${g.grade}: ${g.text}`).join("\n");
  const tasks = ctx.signals.filter((s) => s.current < s.target);
  const list = tasks
    .slice(0, 10)
    .map((s) => `${s.label} ${s.code} ${s.title} (${s.owner}): ${s.current}% → ${wantsAA ? 100 : s.target}%, 매월 +${s.monthlyNeeded}%p`)
    .join("\n");
  return [
    "CP 등급은 공정거래위원회가 1년간의 운영 실적을 평가해 매겨요.",
    head,
    `⚠️ ${GRADE_NOTE}`,
    "",
    `에이텍그룹 로드맵: 2027년 한 해를 실적 연도로 운영하고, 2028년에 최초 등급평가를 신청해 A등급을 목표로 해요. 2030년 목표는 AA예요.`,
    `👉 A등급을 받으려면 아래 과제를 ${DEADLINE_LABEL}까지 연간 목표치로 끌어올려야 해요 (긴급 순):`,
    list,
    wantsAA ? `AA등급은 위 과제를 ${LONG_DEADLINE_LABEL}까지 장기 목표(대부분 100%)로 완성하고, 계열사가 같은 기준으로 운영해야 해요.` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function ruleAnswer(ctx: BotContext, raw: string): string {
  const text = raw.toLowerCase();
  if (/일정|스케줄|교육.*(언제|날짜|다음)|(언제|다음).*교육|위원회|이사회/.test(text) && ctx.schedule.length) {
    const wantsEdu = /교육/.test(text);
    const list = ctx.schedule.filter((s) => !wantsEdu || s.kind === "교육").slice(0, 4);
    return [
      wantsEdu ? `다음 교육은 ${list[0]?.when} '${list[0]?.title}'이에요 (대상: ${list[0]?.target}).` : "다가오는 CP 일정이에요.",
      ...list.map((s) => `📅 ${s.when} [${s.kind}] ${s.title} – ${s.target} / ${s.owner}`),
      "전체 일정은 상단 '일정' 메뉴에서 볼 수 있어요.",
    ].join("\n");
  }
  if (/정보\s?교환|허브|민감한? 정보|고객사를 통해|거래처를 통해/.test(text)) {
    const info = FAQ.find((f) => f.keys.includes("정보교환"));
    if (info) return info.answer(ctx);
  }
  if (/등급|grade|aa|획득/.test(text)) return gradeAnswer(ctx, raw);
  if (/시급|긴급|급한|진척|진행률|진도|위험|늦|signal|시그널|우선/.test(text))
    return `지금 진척 신호예요.\n${signalSummary(ctx)}\n\n🔴 긴급 과제부터 담당 부서와 일정을 잡으세요. 마감은 모두 ${DEADLINE_LABEL}(2027년 실적 연도 말)이에요.`;
  const code = ctx.signals.find((s) => text.includes(s.code.toLowerCase()) || text.includes(s.title.toLowerCase()));
  if (code)
    return `${code.label} ${code.code} ${code.title}\n담당: ${code.owner} · 영역: ${code.domain}\n현재 ${code.current}% / 목표 ${code.target}% (마감 ${code.deadline})\n일정상 지금 ${code.expected}%여야 하고, 매월 +${code.monthlyNeeded}%p씩 올려야 해요.`;
  const q = ctx.questions.find((item) => text.includes(item.id) || (raw.length > 8 && item.prompt.includes(raw.trim())));
  if (q) {
    const faq = FAQ.find((f) => f.keys.some((k) => q.category.includes(k)));
    return `'${q.prompt}' 문항은 ${q.category} 영역이에요. ${faq ? faq.answer(ctx) : "평소 내 업무에서 이 행동을 얼마나 지키는지 5단계로 고르면 돼요."}`;
  }
  let best: { score: number; f: (typeof FAQ)[number] } | null = null;
  for (const f of FAQ) {
    const score = f.keys.filter((k) => text.includes(k)).length;
    if (score > 0 && (!best || score > best.score)) best = { score, f };
  }
  if (best) return best.f.answer(ctx);
  return "제가 도와드릴 수 있는 건 두 가지예요.\n1) 자가진단 질문·용어 설명 (예: '해당 업무 없음은 언제 골라요?', '담합이 뭐예요?')\n2) 진척률 신호와 등급 안내 (예: '지금 시급한 과제는?', 'A등급 받으려면?')\n그 밖의 판단이 필요한 사안은 감사팀에 문의해 주세요.";
}

export function systemPrompt(ctx: BotContext) {
  return `너는 에이텍그룹 공정거래 CP 데스크의 'CP 도우미'야. 항상 한국어로, 초보 직원도 이해하게 짧고 친절하게(10줄 이내) 답해.
역할: (1) 자가진단 문항·용어·응답 방법, CP(공정거래 자율준수프로그램)와 등급 제도 설명 (2) 아래 진척 신호(긴급/주의/양호)를 근거로 어떤 과제를 언제까지 해야 등급을 받을 수 있는지 안내.
규칙: 아래 데이터에 있는 숫자·과제·일정만 사용하고 지어내지 마. 신호 표시는 🔴 긴급, 🟡 주의, 🟢 양호를 써. 데이터를 수정하거나 승인할 수 없고, 구체적인 법률 판단은 감사팀 문의를 권해. 마크다운 표는 쓰지 마.
데이터(JSON): ${JSON.stringify(ctx)}`;
}
