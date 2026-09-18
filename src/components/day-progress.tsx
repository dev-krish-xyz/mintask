"use client"

import { getDayProgress, type DayProgress, type Task } from "@/lib/tasks"
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
  const percent = empty ? 0 : progress.percent
  const clip =
    percent <= 0 ? undefined : (`inset(0 ${100 - percent}% 0 0)` as const)

  return (
    <section
      className={cn(surfaceClass, "relative px-5 py-4 sm:px-6 sm:py-5")}
    >
      <div className="relative z-0">
        <CardBody
          progress={progress}
          empty={empty}
          percent={percent}
          label={label}
          inverted={false}
        />
      </div>

      {percent > 0 ? (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-10 flex transition-[width] duration-500 ease-out"
            style={{ width: `${percent}%` }}
          >
            <div className="min-w-0 flex-1 bg-neutral-900 dark:bg-white/80" />
            <div className="relative h-full w-6 shrink-0 overflow-hidden">
              <div className="mintask-edge-wave absolute inset-x-0 top-0 h-[200%] w-full">
                <svg
                  viewBox="0 0 24 200"
                  preserveAspectRatio="none"
                  className="h-full w-full"
                >
                  <path
                    d="M0 0 H10 C20 16.67 0 33.33 10 50 C20 66.67 0 83.33 10 100 C20 116.67 0 133.33 10 150 C20 166.67 0 183.33 10 200 H0 Z"
                    className="fill-neutral-900 dark:fill-white/80"
                  />
                </svg>
              </div>
            </div>
          </div>
          {clip ? (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-20 px-5 py-4 sm:px-6 sm:py-5"
              style={{ clipPath: clip }}
            >
              <CardBody
                progress={progress}
                empty={empty}
                percent={percent}
                label={label}
                inverted
              />
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  )
}

function CardBody({
  progress,
  empty,
  percent,
  label,
  inverted,
}: {
  progress: DayProgress
  empty: boolean
  percent: number
  label: string
  inverted: boolean
}) {
  return (
    <div className="relative flex items-center gap-4">
      <ProgressRing percent={percent} inverted={inverted} />

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-[11px] font-medium tracking-[0.04em] uppercase",
            inverted
              ? "text-white/65 dark:text-black/55"
              : "text-muted-foreground"
          )}
        >
          {label}
        </p>
        <p
          className={cn(
            "mt-1 text-[15px] font-semibold tracking-[-0.02em]",
            inverted ? "text-white dark:text-black" : "text-foreground"
          )}
        >
          {empty
            ? "Nothing logged yet"
            : `${progress.taskCompleted} of ${progress.taskTotal} tasks complete`}
        </p>
        <p
          className={cn(
            "mt-1.5 text-[12px]",
            inverted
              ? "text-white/60 dark:text-black/50"
              : "text-muted-foreground"
          )}
        >
          {empty
            ? "Add a task to start measuring the day."
            : progress.leafTotal === progress.taskTotal
              ? `${percent}% of the day`
              : `${progress.leafCompleted} of ${progress.leafTotal} steps`}
        </p>
      </div>
    </div>
  )
}

function ProgressRing({
  percent,
  inverted,
}: {
  percent: number
  inverted: boolean
}) {
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
          className={
            inverted ? "stroke-white/25 dark:stroke-black/20" : "stroke-foreground/10"
          }
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={inverted ? "stroke-white dark:stroke-black" : "stroke-foreground"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 300ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </svg>
      <span
        className={cn(
          "absolute inset-0 grid place-items-center text-[13px] font-semibold tabular-nums tracking-tight",
          inverted ? "text-white dark:text-black" : "text-foreground"
        )}
      >
        {percent}%
      </span>
    </div>
  )
}
