"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  formatMonthYear,
  getMonthGrid,
  parseDateKey,
  todayKey,
  WEEKDAYS,
} from "@/lib/dates"
import { getDayProgress, type Workspace } from "@/lib/tasks"
import { cn } from "@/lib/utils"

type MonthCalendarProps = {
  selectedDate: string
  workspaces: Workspace[]
  onSelectDate: (date: string) => void
}

export function MonthCalendar({
  selectedDate,
  workspaces,
  onSelectDate,
}: MonthCalendarProps) {
  const selected = parseDateKey(selectedDate || todayKey())
  const selectedMonthIndex = selected.getFullYear() * 12 + selected.getMonth()
  const [browseIndex, setBrowseIndex] = useState<number | null>(null)
  const [syncedSelection, setSyncedSelection] = useState(selectedDate)

  if (selectedDate !== syncedSelection) {
    setSyncedSelection(selectedDate)
    setBrowseIndex(null)
  }

  const viewIndex = browseIndex ?? selectedMonthIndex
  const year = Math.floor(viewIndex / 12)
  const month = viewIndex % 12
  const cells = getMonthGrid(year, month)
  const today = todayKey()
  const workspaceByDate = new Map(workspaces.map((item) => [item.date, item]))

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13px] font-semibold tracking-[-0.02em] text-foreground">
          {formatMonthYear(year, month)}
        </p>
        <div className="flex items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Previous month"
            className="rounded-full text-muted-foreground"
            onClick={() => setBrowseIndex(viewIndex - 1)}
          >
            <ChevronLeft />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Next month"
            className="rounded-full text-muted-foreground"
            onClick={() => setBrowseIndex(viewIndex + 1)}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {WEEKDAYS.map((day, index) => (
          <div
            key={`${day}-${index}`}
            className="pb-1 text-center text-[10px] font-medium tracking-wide text-muted-foreground"
          >
            {day}
          </div>
        ))}

        {cells.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} />
          }

          const workspace = workspaceByDate.get(date)
          const isSelected = date === selectedDate
          const isToday = date === today
          const percent = workspace ? getDayProgress(workspace.tasks).percent : 0

          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelectDate(date)}
              aria-label={date}
              aria-pressed={isSelected}
              className={cn(
                "relative mx-auto flex size-8 flex-col items-center justify-center rounded-full text-[12px] transition-colors",
                isSelected
                  ? "bg-foreground font-semibold text-background"
                  : isToday
                    ? "font-semibold text-foreground ring-1 ring-foreground/20"
                    : "text-foreground hover:bg-foreground/[0.06]"
              )}
            >
              {parseDateKey(date).getDate()}
              {workspace ? (
                <span
                  className={cn(
                    "absolute bottom-0.5 size-1 rounded-full",
                    isSelected
                      ? "bg-background"
                      : percent === 100
                        ? "bg-foreground"
                        : "bg-foreground/45"
                  )}
                />
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
