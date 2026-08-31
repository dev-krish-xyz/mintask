"use client"

import { getDayProgress, type Task } from "@/lib/tasks"
import { surfaceClass } from "@/lib/surface"
import { cn } from "@/lib/utils"

type DayProgressCardProps = {
  tasks: Task[]
  label?: string
}

export function DayProgressCard({
  tasks,
  label = "Daily progress",
}: DayProgressCardProps) {
  const progress = getDayProgress(tasks)
  const empty = progress.leafTotal === 0

  return (
    <section className={cn(surfaceClass, "px-5 py-4 sm:px-6 sm:py-5")}>
      <div className="flex items-center gap-4">
        <ProgressRing percent={progress.percent} />

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium tracking-[0.04em] text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-1 text-[15px] font-semibold tracking-[-0.02em] text-foreground">
            {empty
              ? "Nothing logged yet"
              : `${progress.taskCompleted} of ${progress.taskTotal} tasks complete`}
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-foreground/[0.08] shadow-[inset_0_1px_1px_oklch(0_0_0/0.08)] dark:bg-foreground/12 dark:shadow-[inset_0_1px_2px_oklch(0_0_0/0.45)]">
            <div
              className="h-full rounded-full bg-foreground/80 shadow-[inset_0_1px_0_oklch(1_0_0/0.28)] transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:bg-foreground/88"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <p className="mt-2 text-[12px] text-muted-foreground">
            {empty
              ? "Add a task to start measuring the day."
              : progress.leafTotal === progress.taskTotal
                ? `${progress.percent}% of the day`
                : `${progress.leafCompleted} of ${progress.leafTotal} steps · ${progress.percent}%`}
          </p>
        </div>
      </div>
    </section>
  )
}

function ProgressRing({ percent }: { percent: number }) {
  const size = 72
  const stroke = 6
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference

  return (
    <div className="relative size-[72px] shrink-0">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-foreground/10"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-foreground"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 300ms cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[13px] font-semibold tabular-nums tracking-tight text-foreground">
        {percent}%
      </span>
    </div>
  )
}
