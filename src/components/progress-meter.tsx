"use client"

type ProgressMeterProps = {
  percent: number
  completedCount: number
  total: number
}

export function ProgressMeter({
  percent,
  completedCount,
  total,
}: ProgressMeterProps) {
  return (
    <div className="mt-3">
      <div className="flex items-center gap-3">
        <div
          role="progressbar"
          aria-label="Task progress"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          className="relative h-2 flex-1 overflow-hidden rounded-full bg-foreground/[0.08] shadow-[inset_0_1px_1px_oklch(0_0_0/0.08)] dark:bg-foreground/12 dark:shadow-[inset_0_1px_2px_oklch(0_0_0/0.45)]"
        >
          <div
            className="h-full rounded-full bg-foreground/80 shadow-[inset_0_1px_0_oklch(1_0_0/0.28)] transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:bg-foreground/88"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="w-8 shrink-0 text-right text-[12px] tabular-nums tracking-tight text-muted-foreground">
          {percent}%
        </span>
      </div>
      <p className="mt-1.5 text-[12px] text-muted-foreground">
        {completedCount} of {total} complete
      </p>
    </div>
  )
}
