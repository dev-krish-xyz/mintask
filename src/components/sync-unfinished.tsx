"use client"

import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatLongDate } from "@/lib/dates"
import {
  getTaskProgress,
  unfinishedGroupsForDate,
  type Task,
  type Workspace,
} from "@/lib/tasks"

type SyncUnfinishedProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentDate: string
  workspaces: Workspace[]
  onSync: (tasks: Task[]) => void
}

export function SyncUnfinished({
  open,
  onOpenChange,
  currentDate,
  workspaces,
  onSync,
}: SyncUnfinishedProps) {
  const groups = useMemo(
    () => unfinishedGroupsForDate(workspaces, currentDate),
    [workspaces, currentDate]
  )
  const allIds = useMemo(
    () => groups.flatMap((group) => group.tasks.map((task) => task.id)),
    [groups]
  )
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!open) return
    setSelected(new Set())
  }, [open, currentDate])

  useEffect(() => {
    setSelected((prev) => {
      const next = new Set([...prev].filter((id) => allIds.includes(id)))
      return next.size === prev.size ? prev : next
    })
  }, [allIds])

  const selectedCount = selected.size
  const allSelected = allIds.length > 0 && selectedCount === allIds.length

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(allIds))
  }

  function syncSelected() {
    const tasks = groups.flatMap((group) =>
      group.tasks.filter((task) => selected.has(task.id))
    )
    if (tasks.length === 0) return
    onSync(tasks)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex w-[min(100%-2rem,440px)] max-h-[min(80dvh,560px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[440px]"
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
          <div className="min-w-0">
            <DialogTitle className="text-[13px] font-medium tracking-[0.04em] text-muted-foreground uppercase">
              Sync unfinished
            </DialogTitle>
            <DialogDescription className="mt-1 text-[12.5px]">
              Incomplete tasks from the last 7 days. Originals stay on their
              day.
            </DialogDescription>
          </div>
          {allIds.length > 0 ? (
            <button
              type="button"
              onClick={toggleAll}
              className="shrink-0 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {allSelected ? "Clear" : "Select all"}
            </button>
          ) : null}
        </div>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {groups.length === 0 ? (
            <p className="px-3 py-8 text-center text-[13.5px] leading-relaxed text-muted-foreground">
              No unfinished tasks in the last 7 days.
            </p>
          ) : (
            groups.map((group) => (
              <section key={group.date} className="px-1 pb-3">
                <h3 className="px-3 pb-1.5 text-[11px] font-medium tracking-[0.04em] text-muted-foreground uppercase">
                  {formatLongDate(group.date)}
                </h3>
                <ul>
                  {group.tasks.map((task) => {
                    const progress = getTaskProgress(task)
                    const checked = selected.has(task.id)
                    return (
                      <li key={task.id}>
                        <label className="flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2 hover:bg-foreground/[0.04]">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggle(task.id)}
                            className="mt-0.5"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-[14px] leading-snug tracking-[-0.015em] text-foreground">
                              {task.title}
                            </span>
                            {progress.hasSubtasks ? (
                              <span className="mt-0.5 block text-[11px] text-muted-foreground">
                                {progress.completedCount} of {progress.total}{" "}
                                steps
                              </span>
                            ) : null}
                          </span>
                        </label>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t px-5 py-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={selectedCount === 0}
            onClick={syncSelected}
          >
            Sync Selected
            {selectedCount > 0 ? ` · ${selectedCount}` : ""}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
