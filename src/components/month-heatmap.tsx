"use client"

import { useLayoutEffect, useRef, useState } from "react"

import {
  formatHeatmapRange,
  formatShortDate,
  getHeatmapWeeks,
  parseDateKey,
  todayKey,
  WEEKDAYS,
} from "@/lib/dates"
import { getDayProgress, type Workspace } from "@/lib/tasks"
import { surfaceClass } from "@/lib/surface"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type MonthHeatmapProps = {
  selectedDate: string
  workspaces: Workspace[]
  onSelectDate: (date: string) => void
  className?: string
}

const CELL = 20
const GAP = 4
const LABEL = 12
const MIN_WEEKS = 13

function weeksForWidth(width: number) {
  if (width <= 0) return MIN_WEEKS
  return Math.max(
    MIN_WEEKS,
    Math.round((width - LABEL) / (CELL + GAP))
  )
}

export function MonthHeatmap({
  selectedDate,
  workspaces,
  onSelectDate,
  className,
}: MonthHeatmapProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const [weekCount, setWeekCount] = useState(MIN_WEEKS)
  const today = todayKey()
  const weeks = getHeatmapWeeks(today, weekCount)
  const startKey = weeks[0]?.[0] ?? today
  const workspaceByDate = new Map(workspaces.map((item) => [item.date, item]))
  const monthLabels = monthLabelsForWeeks(weeks)
  const monthSpan = Math.max(3, Math.round((weeks.length * 7) / 30.4))

  useLayoutEffect(() => {
    const node = gridRef.current
    if (!node) return

    function measure() {
      if (!node) return
      setWeekCount(weeksForWidth(node.clientWidth))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <section className={cn(surfaceClass, "px-4 py-3", className)}>
      <div className="mb-2 flex items-end justify-between gap-3">
        <h2 className="text-[11px] font-medium tracking-[0.04em] text-muted-foreground uppercase">
          Last {monthSpan} months
        </h2>
        <p className="text-[11px] text-muted-foreground">
          {formatHeatmapRange(startKey, today)}
        </p>
      </div>

      <div
        ref={gridRef}
        className="grid w-full gap-1"
        style={{
          gridTemplateColumns: `${LABEL}px repeat(${weeks.length}, minmax(0, 1fr))`,
        }}
      >
        <div />
        {monthLabels.map((label, index) => (
          <div
            key={`month-${index}`}
            className="h-3 text-[9px] font-medium tracking-wide text-muted-foreground"
          >
            {label}
          </div>
        ))}

        {WEEKDAYS.map((day, row) => (
          <div key={`row-${row}`} className="contents">
            <div className="flex items-center text-[9px] font-medium text-muted-foreground">
              {row % 2 === 1 ? day : ""}
            </div>
            {weeks.map((week) => {
              const date = week[row]
              const workspace = workspaceByDate.get(date)
              const percent = workspace
                ? getDayProgress(workspace.tasks).percent
                : 0
              const isFuture = date > today
              const isSelected = date === selectedDate
              const isToday = date === today

              return (
                <Tooltip key={date}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      disabled={isFuture}
                      onClick={() => onSelectDate(date)}
                      aria-label={heatmapLabel(date, workspace, percent)}
                      aria-pressed={isSelected}
                      className={cn(
                        "aspect-square w-full rounded-[4px] transition-shadow",
                        isFuture
                          ? "cursor-default bg-foreground/[0.03]"
                          : heatClass(Boolean(workspace), percent),
                        isSelected &&
                          "ring-2 ring-foreground ring-offset-1 ring-offset-card",
                        isToday && !isSelected && "ring-1 ring-foreground/25"
                      )}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={6}>
                    {heatmapLabel(date, workspace, percent)}
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
        <span>Less</span>
        <span className="size-2.5 rounded-[3px] bg-foreground/[0.06]" />
        <span className="size-2.5 rounded-[3px] bg-foreground/16" />
        <span className="size-2.5 rounded-[3px] bg-foreground/32" />
        <span className="size-2.5 rounded-[3px] bg-foreground/55" />
        <span className="size-2.5 rounded-[3px] bg-foreground/90" />
        <span>More</span>
      </div>
    </section>
  )
}

function monthLabelsForWeeks(weeks: string[][]) {
  return weeks.map((week, index) => {
    const monthStart = week.find((date) => parseDateKey(date).getDate() === 1)
    const labelDate = monthStart ?? (index === 0 ? week[0] : undefined)
    if (!labelDate) return ""

    return parseDateKey(labelDate).toLocaleDateString(undefined, {
      month: "short",
    })
  })
}

function heatClass(hasWorkspace: boolean, percent: number) {
  if (!hasWorkspace) return "bg-foreground/[0.06]"
  if (percent >= 100) return "bg-foreground/90"
  if (percent >= 75) return "bg-foreground/62"
  if (percent >= 50) return "bg-foreground/42"
  if (percent >= 25) return "bg-foreground/26"
  if (percent > 0) return "bg-foreground/14"
  return "bg-foreground/[0.08]"
}

function heatmapLabel(
  date: string,
  workspace: Workspace | undefined,
  percent: number
) {
  const day = formatShortDate(date)
  if (!workspace) return `${day} · no workspace`
  if (workspace.tasks.length === 0) return `${day} · empty`
  return `${day} · ${percent}%`
}
