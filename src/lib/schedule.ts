import type { ScheduleItem } from "./types";
import { seoulParts } from "./period";

export function todayIso() {
  const { year, month, day } = seoulParts();
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function sortSchedule(items: ScheduleItem[]) {
  return [...items].sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title));
}

export function upcoming(items: ScheduleItem[], limit = 4, kind?: ScheduleItem["kind"]) {
  const today = todayIso();
  return sortSchedule(items)
    .filter((item) => item.status === "예정" && (item.end || item.start) >= today && (!kind || item.kind === kind))
    .slice(0, limit);
}

export function periodLabel(item: Pick<ScheduleItem, "start" | "end">) {
  const f = (d: string) => d.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$1.$2.$3");
  return item.end && item.end !== item.start ? `${f(item.start)} ~ ${f(item.end).slice(5)}` : f(item.start);
}
