import type { PlanItem } from "./types";

export function planGapCopy(plan: PlanItem, near: string, long: string) {
  const nearGap = plan.targetYear - plan.current;
  const longGap = plan.targetLong - plan.current;
  if (plan.current >= plan.targetLong) {
    return `${long}년 목표 ${plan.targetLong}%에 도달했습니다.`;
  }
  if (plan.current >= plan.targetYear) {
    return `${near}년 목표 ${plan.targetYear}%에 도달했습니다. ${long}년 목표까지 ${longGap}%p 남았습니다.`;
  }
  if (plan.current === 0) {
    return `아직 진척이 없습니다. ${near}년 목표까지 ${nearGap}%p, ${long}년 목표까지 ${longGap}%p 남았습니다.`;
  }
  return `${near}년 목표까지 ${nearGap}%p, ${long}년 목표까지 ${longGap}%p 남았습니다.`;
}
