export function GoalBar({
  current,
  target,
  longTarget,
  showLegend = true,
}: {
  current: number;
  target: number;
  longTarget?: number;
  showLegend?: boolean;
}) {
  const clamp = (value: number) => Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-2">
      <div className="relative h-2 rounded-full bg-[#e6e0d6]">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[#1d3b57]"
          style={{ width: `${clamp(current)}%` }}
        />
        <span
          className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 bg-[#9a7b45]"
          style={{ left: `${clamp(target)}%` }}
          title={`가까운 목표 ${target}%`}
        />
        {longTarget !== undefined ? (
          <span
            className="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#9a7b45]"
            style={{ left: `${clamp(longTarget)}%` }}
            title={`중장기 목표 ${longTarget}%`}
          />
        ) : null}
      </div>
      {showLegend ? <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#667386]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-4 rounded-full bg-[#1d3b57]" /> 현재
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-0.5 bg-[#9a7b45]" /> 가까운 목표
        </span>
        {longTarget !== undefined ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-[#9a7b45]" /> 중장기 목표
          </span>
        ) : null}
      </div> : null}
    </div>
  );
}
