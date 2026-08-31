"use client"

import { useState } from "react"
import { Ellipsis, Plus, Trash2 } from "lucide-react"

import { EditableTitle } from "@/components/editable-title"
import { ProgressMeter } from "@/components/progress-meter"
import { SubtaskList } from "@/components/subtask-list"
import { TaskCheck } from "@/components/task-check"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getTaskProgress, type Task } from "@/lib/tasks"
import { cn } from "@/lib/utils"

type TaskItemProps = {
  task: Task
  editingId: string | null
  onEditingIdChange: (id: string | null) => void
  onRename: (title: string) => void
  onToggle: () => void
  onDelete: () => void
  onAddSubtask: () => string | Promise<string>
  onRenameSubtask: (subtaskId: string, title: string) => void
  onToggleSubtask: (subtaskId: string) => void
  onDeleteSubtask: (subtaskId: string) => void
  onReorderSubtasks: (activeId: string, overId: string) => void
}

export function TaskItem({
  task,
  editingId,
  onEditingIdChange,
  onRename,
  onToggle,
  onDelete,
  onAddSubtask,
  onRenameSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onReorderSubtasks,
}: TaskItemProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const progress = getTaskProgress(task)
  const isEditingTitle = editingId === task.id
  const hasSubtasks = progress.hasSubtasks

  async function addAndEditSubtask() {
    const id = await onAddSubtask()
    if (id) onEditingIdChange(id)
  }

  return (
    <article className="group">
      <div className="flex items-start gap-3">
        <TaskCheck
          checked={progress.isComplete}
          label={`Mark “${task.title || "Untitled"}” ${progress.isComplete ? "incomplete" : "complete"}`}
          onToggle={onToggle}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <EditableTitle
              value={task.title}
              editing={isEditingTitle}
              onEditingChange={(editing) =>
                onEditingIdChange(editing ? task.id : null)
              }
              onChange={onRename}
              onEmptyCommit={() => {
                if (task.subtasks.length === 0) onDelete()
                else onEditingIdChange(null)
              }}
              placeholder="New task"
              className={cn(
                "min-w-0 flex-1 py-0.5 text-[16px] font-semibold leading-snug tracking-[-0.02em]",
                progress.isComplete &&
                  "text-muted-foreground line-through decoration-foreground/20"
              )}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Task actions"
                  className="rounded-full text-muted-foreground opacity-100 hover:text-foreground md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                >
                  <Ellipsis />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-40">
                <DropdownMenuItem onClick={addAndEditSubtask}>
                  <Plus />
                  Add sub-task
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setConfirmOpen(true)}
                >
                  <Trash2 />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {hasSubtasks ? (
            <ProgressMeter
              percent={progress.percent}
              completedCount={progress.completedCount}
              total={progress.total}
            />
          ) : null}

          {hasSubtasks ? (
            <SubtaskList
              listId={task.id}
              subtasks={task.subtasks}
              editingId={editingId}
              onEditingIdChange={onEditingIdChange}
              onToggle={onToggleSubtask}
              onRename={onRenameSubtask}
              onDelete={onDeleteSubtask}
              onReorder={onReorderSubtasks}
              onAdd={onAddSubtask}
            />
          ) : (
            <div className="mt-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={addAndEditSubtask}
                className="-ml-2 rounded-full text-muted-foreground hover:text-foreground"
              >
                <Plus />
                Add sub-task
              </Button>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              {hasSubtasks
                ? "This removes the task and all of its sub-tasks."
                : "This cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  )
}
