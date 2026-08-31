"use client"

import { useCallback, useEffect, useState } from "react"
import { CalendarDays, PenLine, Plus, Trash2 } from "lucide-react"

import { DayProgressCard } from "@/components/day-progress"
import { EditableTitle } from "@/components/editable-title"
import { IdeasList } from "@/components/ideas-list"
import { MonthHeatmap } from "@/components/month-heatmap"
import { NotesPad } from "@/components/notes-pad"
import { TaskItem } from "@/components/task-item"
import { ThemeToggle } from "@/components/theme-toggle"
import { WorkspaceSidebar } from "@/components/workspace-sidebar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTasks } from "@/hooks/use-tasks"
import { formatLongDate, todayKey } from "@/lib/dates"
import { surfaceClass, surfaceScrollClass } from "@/lib/surface"
import type { Workspace } from "@/lib/tasks"
import { cn } from "@/lib/utils"

export function TaskApp() {
  const {
    ready,
    workspaces,
    activeDate,
    setSelectedDate,
    workspace,
    tasks,
    ideas,
    createCurrentWorkspace,
    renameWorkspace,
    deleteWorkspace,
    addTask,
    updateTaskTitle,
    toggleTask,
    deleteTask,
    addSubtask,
    updateSubtaskTitle,
    toggleSubtask,
    deleteSubtask,
    reorderSubtasks,
    addIdea,
    updateIdea,
    deleteIdea,
  } = useTasks()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)

  const createTask = useCallback(async () => {
    if (!workspace) return
    const id = await addTask()
    if (id) setEditingId(id)
  }, [addTask, workspace])

  const createWorkspace = useCallback(() => {
    createCurrentWorkspace()
  }, [createCurrentWorkspace])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "i") {
        event.preventDefault()
        setNotesOpen((open) => !open)
        return
      }

      if (event.key !== "n" && event.key !== "N") return
      if (event.metaKey || event.ctrlKey || event.altKey) return

      const target = event.target
      if (!(target instanceof HTMLElement)) return
      if (target.closest("input, textarea, select, [contenteditable='true']")) {
        return
      }

      event.preventDefault()
      if (workspace) createTask()
      else createWorkspace()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [createTask, createWorkspace, workspace])

  function selectDate(date: string) {
    setSelectedDate(date)
    setCalendarOpen(false)
    setEditingId(null)
    setEditingTitle(false)
  }

  const isToday = activeDate === todayKey()

  return (
    <div className="flex h-dvh min-h-0 w-full overflow-hidden">
      <aside className="hidden w-[300px] shrink-0 border-r border-border/70 lg:block">
        <div className="flex h-full flex-col overflow-hidden px-5 py-6">
          <WorkspaceSidebar
            selectedDate={activeDate}
            workspaces={workspaces}
            onSelectDate={selectDate}
          />
        </div>
      </aside>

      <Sheet open={calendarOpen} onOpenChange={setCalendarOpen}>
        <SheetContent side="left" className="w-[320px] p-5">
          <SheetHeader className="sr-only">
            <SheetTitle>Workspaces</SheetTitle>
          </SheetHeader>
          <WorkspaceSidebar
            selectedDate={activeDate}
            workspaces={workspaces}
            onSelectDate={selectDate}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 w-full flex-1 flex-col px-4 pt-4 pb-4 sm:px-6 sm:pt-6 lg:pl-12">
          {ready && workspace ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="mb-4 w-full max-w-[640px] shrink-0">
                <WorkspaceHeader
                  workspace={workspace}
                  isToday={isToday}
                  activeDate={activeDate}
                  editingTitle={editingTitle}
                  onEditingTitleChange={setEditingTitle}
                  onRename={renameWorkspace}
                  onOpenCalendar={() => setCalendarOpen(true)}
                  onOpenNotes={() => setNotesOpen(true)}
                  onDelete={() => setConfirmDelete(true)}
                  onNewTask={createTask}
                />
              </div>

              <div className="flex min-h-0 flex-1 gap-4 lg:gap-8">
                <div className="flex h-full min-h-0 w-full min-w-0 max-w-[640px] shrink-0 flex-col gap-4">
                  <div className="shrink-0">
                    <DayProgressCard
                      tasks={tasks}
                      label="Overall progress"
                    />
                  </div>

                  {tasks.length > 0 ? (
                    <div className={surfaceScrollClass}>
                      <ul
                        aria-label="Tasks"
                        className="divide-y divide-border/80"
                      >
                        {tasks.map((task) => (
                          <li
                            key={task.id}
                            className="px-3 py-2.5 transition-colors hover:bg-foreground/[0.02] sm:px-4 sm:py-3 dark:hover:bg-foreground/[0.03]"
                          >
                            <TaskItem
                              task={task}
                              editingId={editingId}
                              onEditingIdChange={setEditingId}
                              onRename={(title) =>
                                updateTaskTitle(task.id, title)
                              }
                              onToggle={() => toggleTask(task.id)}
                              onDelete={() => deleteTask(task.id)}
                              onAddSubtask={() => addSubtask(task.id)}
                              onRenameSubtask={(subtaskId, title) =>
                                updateSubtaskTitle(task.id, subtaskId, title)
                              }
                              onToggleSubtask={(subtaskId) =>
                                toggleSubtask(task.id, subtaskId)
                              }
                              onDeleteSubtask={(subtaskId) =>
                                deleteSubtask(task.id, subtaskId)
                              }
                              onReorderSubtasks={(activeId, overId) =>
                                reorderSubtasks(task.id, activeId, overId)
                              }
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <EmptyTasks onCreate={createTask} />
                  )}
                </div>

                <div className="hidden h-full min-h-0 w-[420px] shrink-0 flex-col gap-4 lg:flex">
                  <IdeasList
                    ideas={ideas}
                    onUpdate={updateIdea}
                    onDelete={deleteIdea}
                    onCapture={() => setNotesOpen(true)}
                    className="min-h-0 flex-1"
                  />
                  <MonthHeatmap
                    selectedDate={activeDate}
                    workspaces={workspaces}
                    onSelectDate={selectDate}
                    className="shrink-0"
                  />
                </div>
              </div>

              <div className="mt-4 flex min-h-0 shrink-0 flex-col gap-4 lg:hidden">
                <IdeasList
                  ideas={ideas}
                  onUpdate={updateIdea}
                  onDelete={deleteIdea}
                  onCapture={() => setNotesOpen(true)}
                  className="h-[220px]"
                />
                <MonthHeatmap
                  selectedDate={activeDate}
                  workspaces={workspaces}
                  onSelectDate={selectDate}
                />
              </div>
            </div>
          ) : (
            <div className="w-full max-w-[640px] space-y-4">
              <WorkspaceHeader
                workspace={null}
                isToday={isToday}
                activeDate={activeDate}
                ready={ready}
                editingTitle={false}
                onEditingTitleChange={() => {}}
                onRename={() => {}}
                onOpenCalendar={() => setCalendarOpen(true)}
                onOpenNotes={() => setNotesOpen(true)}
                onDelete={() => {}}
                onNewTask={createWorkspace}
              />
              {ready ? (
                <EmptyWorkspace
                  isToday={isToday}
                  onCreate={createWorkspace}
                />
              ) : (
                <LoadingState />
              )}
            </div>
          )}
        </div>
      </div>

      <NotesPad
        open={notesOpen}
        onOpenChange={setNotesOpen}
        onSave={addIdea}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this workspace?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the workspace and every task and idea inside it for{" "}
              {formatLongDate(activeDate)}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                deleteWorkspace()
                setConfirmDelete(false)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function WorkspaceHeader({
  workspace,
  isToday,
  activeDate,
  ready = true,
  editingTitle,
  onEditingTitleChange,
  onRename,
  onOpenCalendar,
  onOpenNotes,
  onDelete,
  onNewTask,
}: {
  workspace: Workspace | null
  isToday: boolean
  activeDate: string
  ready?: boolean
  editingTitle: boolean
  onEditingTitleChange: (editing: boolean) => void
  onRename: (title: string) => void
  onOpenCalendar: () => void
  onOpenNotes: () => void
  onDelete: () => void
  onNewTask: () => void
}) {
  return (
    <header className="flex w-full shrink-0 items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Open calendar"
          className="mt-0.5 rounded-full lg:hidden"
          onClick={onOpenCalendar}
        >
          <CalendarDays />
        </Button>

        <div className="min-w-0">
          {workspace ? (
            <>
              <EditableTitle
                value={workspace.title}
                editing={editingTitle}
                onEditingChange={onEditingTitleChange}
                onChange={onRename}
                onEmptyCommit={() => onEditingTitleChange(false)}
                placeholder="Workspace"
                className="text-[22px] font-semibold tracking-[-0.035em] text-foreground"
              />
              <p className="mt-1 text-[13px] text-muted-foreground">
                {isToday ? "Today · " : ""}
                {formatLongDate(activeDate)}
              </p>
            </>
          ) : (
            <>
              <h1 className="text-[22px] font-semibold tracking-[-0.035em] text-foreground">
                {ready ? formatLongDate(activeDate) : "mintask"}
              </h1>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {isToday
                  ? "No workspace for today yet."
                  : "No workspace on this day."}
              </p>
            </>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <div className="lg:hidden">
          <ThemeToggle />
        </div>
        {workspace ? (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Quick note"
                  className="rounded-full text-muted-foreground hover:text-foreground"
                  onClick={onOpenNotes}
                >
                  <PenLine />
                </Button>
              </TooltipTrigger>
              <TooltipContent>⌘I</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Delete workspace"
                  className="rounded-full text-muted-foreground hover:text-foreground"
                  onClick={onDelete}
                >
                  <Trash2 />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete workspace</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  onClick={onNewTask}
                  className="h-8 rounded-full px-3.5"
                >
                  <Plus />
                  New Task
                </Button>
              </TooltipTrigger>
              <TooltipContent>Press N</TooltipContent>
            </Tooltip>
          </>
        ) : (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Quick note"
                  className="rounded-full text-muted-foreground hover:text-foreground"
                  onClick={onOpenNotes}
                >
                  <PenLine />
                </Button>
              </TooltipTrigger>
              <TooltipContent>⌘I</TooltipContent>
            </Tooltip>
            <Button
              type="button"
              onClick={onNewTask}
              className="h-8 rounded-full px-3.5"
            >
              <Plus />
              New Workspace
            </Button>
          </>
        )}
      </div>
    </header>
  )
}

function EmptyWorkspace({
  isToday,
  onCreate,
}: {
  isToday: boolean
  onCreate: () => void
}) {
  return (
    <div
      className={cn(
        surfaceClass,
        "flex flex-1 flex-col items-center justify-center px-6 py-24 text-center"
      )}
    >
      <p className="text-[17px] font-semibold tracking-[-0.025em] text-foreground">
        {isToday ? "Start today's workspace" : "Create a workspace"}
      </p>
      <p className="mt-1.5 max-w-[280px] text-[13px] leading-relaxed text-muted-foreground">
        A workspace holds the tasks and ideas for this day. Press ⌘I to
        capture a thought.
      </p>
      <Button
        type="button"
        onClick={onCreate}
        className="mt-6 h-8 rounded-full px-3.5"
      >
        <Plus />
        New Workspace
      </Button>
    </div>
  )
}

function EmptyTasks({ onCreate }: { onCreate: () => void }) {
  return (
    <div
      className={cn(
        surfaceClass,
        "flex flex-col items-center justify-center px-6 py-16 text-center"
      )}
    >
      <p className="text-[15px] font-semibold tracking-[-0.025em] text-foreground">
        No tasks yet
      </p>
      <p className="mt-1.5 max-w-[250px] text-[13px] leading-relaxed text-muted-foreground">
        Add a task and break it into sub-tasks when the work needs it.
      </p>
      <Button
        type="button"
        onClick={onCreate}
        className="mt-6 h-8 rounded-full px-3.5"
      >
        <Plus />
        New Task
      </Button>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <div className={cn(surfaceClass, "h-[112px] animate-pulse bg-card")} />
      <div className={cn(surfaceClass, "divide-y divide-border/80")}>
        <div className="h-[88px] animate-pulse bg-muted/40" />
        <div className="h-[88px] animate-pulse bg-muted/25" />
        <div className="h-[64px] animate-pulse bg-muted/15" />
      </div>
    </div>
  )
}
