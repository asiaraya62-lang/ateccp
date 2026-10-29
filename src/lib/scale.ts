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

export function scoreSnapshots(answers: AnswerSnapshot[]) {
  const scale = answers.filter((answer) => answer.type === "scale");
  const applicable = scale.filter((answer) => answer.value !== "na" && answer.value !== "");
  const notApplicable = scale.filter((answer) => answer.value === "na").length;
  const points = applicable.reduce((sum, answer) => sum + Number(answer.value || 0), 0);
  const score =
    applicable.length === 0 ? null : Math.round((points / (applicable.length * 5)) * 100);
  const attention = scale
    .filter((answer) => answer.value === "1" || answer.value === "2")
    .map((answer) => ({
      questionId: answer.questionId,
      prompt: answer.prompt,
      value: answer.value,
    }));
  return {
    score,
    answeredScale: applicable.length,
    notApplicable,
    attention,
  };
}
