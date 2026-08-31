"use client"

import { formatMonthYearFromKey, formatShortDate, todayKey } from "@/lib/dates"
import { getDayProgress, type Workspace } from "@/lib/tasks"
import { cn } from "@/lib/utils"

import { UserButton } from "@clerk/nextjs"

import { MonthCalendar } from "@/components/month-calendar"
import { ThemeToggle } from "@/components/theme-toggle"

type WorkspaceSidebarProps = {
  selectedDate: string
  workspaces: Workspace[]
  onSelectDate: (date: string) => void
}

export function WorkspaceSidebar({
  selectedDate,
  workspaces,
  onSelectDate,
}: WorkspaceSidebarProps) {
  const groups = groupWorkspaces(workspaces)
  const today = todayKey()

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-1 pb-5">
        <div>
          <p className="text-[15px] font-semibold tracking-[-0.03em] text-foreground">
            mintask
          </p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Workspaces by day
          </p>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <UserButton />
        </div>
      </div>

      <MonthCalendar
        selectedDate={selectedDate}
        workspaces={workspaces}
        onSelectDate={onSelectDate}
      />

      <div className="no-scrollbar mt-6 min-h-0 flex-1 overflow-y-auto">
        <p className="mb-2 text-[11px] font-medium tracking-[0.04em] text-muted-foreground uppercase">
          Workspaces
        </p>

        {groups.length === 0 ? (
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Create a workspace for a day to start tracking it.
          </p>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group.label}>
                <p className="mb-1.5 text-[12px] font-medium text-muted-foreground">
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((workspace) => {
                    const progress = getDayProgress(workspace.tasks)
                    const isActive = workspace.date === selectedDate

                    return (
                      <li key={workspace.id}>
                        <button
                          type="button"
                          onClick={() => onSelectDate(workspace.date)}
                          className={cn(
                            "relative flex w-full items-center gap-2 overflow-hidden rounded-lg px-2 py-1.5 text-left transition-colors",
                            isActive
                              ? "bg-foreground/[0.05] dark:bg-foreground/[0.07]"
                              : "hover:bg-foreground/[0.03]"
                          )}
                        >
                          <span
                            aria-hidden
                            className="pointer-events-none absolute inset-y-0 left-0 bg-foreground/[0.08] transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:bg-foreground/[0.12]"
                            style={{
                              width:
                                progress.leafTotal === 0
                                  ? "0%"
                                  : `${progress.percent}%`,
                            }}
                          />
                          <span className="relative min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-medium tracking-[-0.015em] text-foreground">
                              {workspace.title}
                            </span>
                            <span className="block text-[11px] text-muted-foreground">
                              {workspace.date === today
                                ? "Today"
                                : formatShortDate(workspace.date)}
                            </span>
                          </span>
                          <span className="relative shrink-0 text-[11px] tabular-nums text-muted-foreground">
                            {progress.taskTotal === 0 ? "—" : `${progress.percent}%`}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function groupWorkspaces(workspaces: Workspace[]) {
  const sorted = [...workspaces].sort((a, b) => b.date.localeCompare(a.date))
  const groups: { label: string; items: Workspace[] }[] = []

  for (const workspace of sorted) {
    const label = formatMonthYearFromKey(workspace.date)
    const last = groups[groups.length - 1]
    if (last?.label === label) {
      last.items.push(workspace)
    } else {
      groups.push({ label, items: [workspace] })
    }
  }

  return groups
}
