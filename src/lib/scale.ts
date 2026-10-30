import rubric from "./rubric.json";
import type { AnswerSnapshot } from "./types";

export const SCALE = [
  { value: "5", label: "항상 지킨다" },
  { value: "4", label: "대체로 지킨다" },
  { value: "3", label: "가끔 헷갈린다" },
  { value: "2", label: "잘 지키지 못한다" },
  { value: "1", label: "지키지 않는다" },
  { value: "na", label: "해당 업무 없음" },
] as const;

export function scaleLabel(value: string) {
  return SCALE.find((item) => item.value === value)?.label ?? value;
}

type RubricItem = { id: string; category: string; risk: string; weight: number; infoExchange: boolean };
const ITEMS = new Map<string, RubricItem>((rubric.items as RubricItem[]).map((item) => [item.id, item]));
const CATEGORY_WEIGHTS = rubric.categories as Record<string, { weight: number }>;
const ANSWER_SCORE = rubric.answer_score as Record<string, number>;
export const INFO_EXCHANGE_IDS = new Set<string>(rubric.info_exchange_ids);
export const RISK_BANDS = rubric.risk_bands as { band: string; min: number; ref: string; action: string }[];
const DEFAULT_CATEGORY_WEIGHT = 5; // 자체 기준: 평가표에 없는 신규 분야
const DEFAULT_QUESTION_WEIGHT = 2; // 자체 기준: 평가표에 없는 신규 문항(위험도 중)

export type CategoryScore = {
  category: string;
  weight: number;
  score: number | null;
  answered: number;
  notApplicable: number;
};

export type RedFlag = {
  id: string;
  level: "critical" | "warning";
  title: string;
  action: string;
  questions: { questionId: string; prompt: string; value: string }[];
};

export type ScoreResult = {
  score: number | null;
  answeredScale: number;
  notApplicable: number;
  attention: { questionId: string; prompt: string; value: string }[];
  categories: CategoryScore[];
  band: { band: string; action: string; ref: string } | null;
  redFlags: RedFlag[];
  infoExchange: { score: number | null; answered: number; flagged: number };
};

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

export function questionMeta(questionId: string, category: string) {
  const item = ITEMS.get(questionId);
  return {
    risk: item?.risk ?? "M",
    weight: item?.weight ?? DEFAULT_QUESTION_WEIGHT,
    infoExchange: INFO_EXCHANGE_IDS.has(questionId),
    category: item?.category ?? category,
  };
}

export function scoreSnapshots(answers: AnswerSnapshot[], categoryOf: (id: string) => string = () => "추가"): ScoreResult {
  const scale = answers.filter((answer) => answer.type === "scale");
  const applicable = scale.filter((answer) => answer.value !== "na" && answer.value !== "");
  const notApplicable = scale.filter((answer) => answer.value === "na").length;
  const attention = scale
    .filter((answer) => answer.value === "1" || answer.value === "2")
    .map((answer) => ({ questionId: answer.questionId, prompt: answer.prompt, value: answer.value }));

  const byCategory = new Map<string, { sum: number; weights: number; answered: number; na: number }>();
  for (const answer of scale) {
    const meta = questionMeta(answer.questionId, categoryOf(answer.questionId));
    const bucket = byCategory.get(meta.category) ?? { sum: 0, weights: 0, answered: 0, na: 0 };
    if (answer.value === "na") bucket.na += 1;
    else if (answer.value in ANSWER_SCORE) {
      bucket.sum += meta.weight * ANSWER_SCORE[answer.value];
      bucket.weights += meta.weight;
      bucket.answered += 1;
    }
    byCategory.set(meta.category, bucket);
  }
  const categories: CategoryScore[] = [...byCategory.entries()].map(([category, b]) => ({
    category,
    weight: CATEGORY_WEIGHTS[category]?.weight ?? DEFAULT_CATEGORY_WEIGHT,
    score: b.weights ? round1(b.sum / b.weights) : null,
    answered: b.answered,
    notApplicable: b.na,
  }));
  const scored = categories.filter((c) => c.score !== null);
  const totalWeight = scored.reduce((s, c) => s + c.weight, 0);
  const score = totalWeight ? round1(scored.reduce((s, c) => s + c.weight * (c.score as number), 0) / totalWeight) : null;

  const pick = (filter: (answer: AnswerSnapshot) => boolean) =>
    scale.filter(filter).map((a) => ({ questionId: a.questionId, prompt: a.prompt, value: a.value }));
  const cat = (a: AnswerSnapshot) => questionMeta(a.questionId, categoryOf(a.questionId)).category;
  const low = (a: AnswerSnapshot, max: number) => a.value !== "na" && a.value !== "" && Number(a.value) <= max;
  const redFlags: RedFlag[] = [];
  const add = (flag: RedFlag) => {
    if (flag.questions.length) redFlags.push(flag);
  };
  add({
    id: "RF8",
    level: "critical",
    title: "정보교환 담합 위험 응답",
    action: "즉시 점검 + 법무검토 + 정보교환 담합 교육 안내",
    questions: pick((a) => INFO_EXCHANGE_IDS.has(a.questionId) && low(a, 2)),
  });
  add({
    id: "RF2",
    level: "critical",
    title: "담합·입찰 문항 '지키지 않는다' 응답",
    action: "즉시 점검 + 법무검토(형사·고발 리스크)",
    questions: pick((a) => ["담합", "입찰"].includes(cat(a)) && a.value === "1"),
  });
  add({
    id: "RF1",
    level: "critical",
    title: "고위험 문항 미준수 응답",
    action: "즉시 점검 – 감사팀 사실관계 확인",
    questions: pick((a) => questionMeta(a.questionId, cat(a)).risk === "H" && low(a, 2)),
  });
  const rf3 = pick((a) => questionMeta(a.questionId, cat(a)).risk === "M" && a.value === "1");
  for (const c of categories) {
    const lows = scale.filter((a) => cat(a) === c.category && low(a, 2));
    if (lows.length >= 2) for (const a of lows) if (!rf3.some((x) => x.questionId === a.questionId)) rf3.push({ questionId: a.questionId, prompt: a.prompt, value: a.value });
  }
  add({ id: "RF3", level: "warning", title: "분야 내 반복 미준수", action: "주의 – CP담당자 면담", questions: rf3 });
  for (const c of categories) {
    if (c.score !== null && c.answered >= 2 && c.score < 55)
      redFlags.push({ id: "RF4", level: "warning", title: `${c.category} 분야 ${c.score}점(55점 미만)`, action: "분야 경고 – 부서 재교육", questions: [] });
  }
  add({ id: "RF5", level: "warning", title: "거래 관련 기록 삭제 위험", action: "기록보존 지침 재안내(조사방해 리스크)", questions: pick((a) => a.questionId === "s48" && low(a, 4)) });
  if (scale.length && notApplicable / scale.length > 0.6)
    redFlags.push({ id: "RF6", level: "warning", title: `'해당 업무 없음' ${Math.round((notApplicable / scale.length) * 100)}%`, action: "응답 신뢰성 확인(직무 대비 검토)", questions: [] });

  let band = score === null ? null : RISK_BANDS.find((b) => score >= b.min) ?? RISK_BANDS[RISK_BANDS.length - 1];
  if (band && redFlags.some((f) => f.level === "critical")) band = RISK_BANDS[RISK_BANDS.length - 1]; // RF7

  const ix = scale.filter((a) => INFO_EXCHANGE_IDS.has(a.questionId) && a.value in ANSWER_SCORE);
  const ixWeights = ix.reduce((s, a) => s + questionMeta(a.questionId, "담합").weight, 0);
  const infoExchange = {
    score: ixWeights ? round1(ix.reduce((s, a) => s + questionMeta(a.questionId, "담합").weight * ANSWER_SCORE[a.value], 0) / ixWeights) : null,
    answered: ix.length,
    flagged: redFlags.find((f) => f.id === "RF8")?.questions.length ?? 0,
  };

  return {
    score,
    answeredScale: applicable.length,
    notApplicable,
    attention,
    categories,
    band: band ? { band: band.band, action: band.action, ref: band.ref } : null,
    redFlags,
    infoExchange,
  };
}
