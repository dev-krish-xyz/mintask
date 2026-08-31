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
  label = "Overall progress",
}: DayProgressCardProps) {
  const progress = getDayProgress(tasks)
  const empty = progress.leafTotal === 0

  return (
    <section
      className={cn(surfaceClass, "relative px-5 py-4 sm:px-6 sm:py-5")}
    >
      <WaveFill percent={empty ? 0 : progress.percent} />
      <div className="relative flex items-center gap-4">
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
          <p className="mt-1.5 text-[12px] text-muted-foreground">
            {empty
              ? "Add a task to start measuring the day."
              : progress.leafTotal === progress.taskTotal
                ? `${progress.percent}% of the day`
                : `${progress.leafCompleted} of ${progress.leafTotal} steps`}
          </p>
        </div>
      </div>
    </section>
  )
}

function WaveFill({ percent }: { percent: number }) {
  if (percent <= 0) return null

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{ height: `${percent}%` }}
    >
      <div className="absolute inset-x-0 top-[14px] bottom-0 bg-foreground/[0.07] dark:bg-foreground/[0.11]" />
      <div className="absolute top-0 left-0 h-7 w-full -translate-y-1/2">
        <svg
          viewBox="0 0 480 40"
          preserveAspectRatio="none"
          className="mintask-wave h-full w-[200%]"
        >
          <path
            d="M0 20 C 40 6, 80 6, 120 20 C 160 34, 200 34, 240 20 C 280 6, 320 6, 360 20 C 400 34, 440 34, 480 20 V40 H0 Z"
            className="fill-foreground/[0.07] dark:fill-foreground/[0.11]"
          />
        </svg>
      </div>
      <div className="absolute top-0 left-0 h-6 w-full -translate-y-[40%]">
        <svg
          viewBox="0 0 480 40"
          preserveAspectRatio="none"
          className="mintask-wave-slow h-full w-[200%]"
        >
          <path
            d="M0 22 C 50 10, 90 10, 140 22 C 190 34, 230 34, 280 22 C 330 10, 370 10, 420 22 C 450 34, 470 34, 480 22 V40 H0 Z"
            className="fill-foreground/[0.045] dark:fill-foreground/[0.07]"
          />
        </svg>
      </div>
    </div>
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
