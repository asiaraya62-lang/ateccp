export function seoulParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const pick = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const year = pick("year");
  const month = pick("month");
  const day = pick("day");
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { year, month, day, last };
}

export function seoulPeriod(date = new Date()) {
  const { year, month } = seoulParts(date);
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function seoulPeriodLabel(period: string) {
  const [year, month] = period.split("-");
  return `${year}년 ${Number(month)}월`;
}

export function seoulStamp(date = new Date()) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function daysLeftInMonth(date = new Date()) {
  const { day, last } = seoulParts(date);
  return Math.max(0, last - day + 1);
}
