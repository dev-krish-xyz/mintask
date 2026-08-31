"use client"

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Plus, Trash2 } from "lucide-react"

import { EditableTitle } from "@/components/editable-title"
import { TaskCheck } from "@/components/task-check"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Subtask } from "@/lib/tasks"

type SubtaskListProps = {
  listId: string
  subtasks: Subtask[]
  editingId: string | null
  onEditingIdChange: (id: string | null) => void
  onToggle: (subtaskId: string) => void
  onRename: (subtaskId: string, title: string) => void
  onDelete: (subtaskId: string) => void
  onReorder: (activeId: string, overId: string) => void
  onAdd: () => string | Promise<string>
}

export function SubtaskList({
  listId,
  subtasks,
  editingId,
  onEditingIdChange,
  onToggle,
  onRename,
  onDelete,
  onReorder,
  onAdd,
}: SubtaskListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    onReorder(String(active.id), String(over.id))
  }

  return (
    <div className="mt-3.5 ml-1 border-l border-border/70 pl-4">
      <DndContext
        id={listId}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={subtasks.map((subtask) => subtask.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul aria-label="Sub-tasks" className="space-y-0.5">
            {subtasks.map((subtask, index) => (
              <SortableSubtask
                key={subtask.id}
                subtask={subtask}
                showHandle={subtasks.length > 1}
                isLast={index === subtasks.length - 1}
                editing={editingId === subtask.id}
                onEditingChange={(editing) =>
                  onEditingIdChange(editing ? subtask.id : null)
                }
                onToggle={() => onToggle(subtask.id)}
                onRename={(title) => onRename(subtask.id, title)}
                onDelete={() => onDelete(subtask.id)}
                onAddNext={async () => {
                  const id = await onAdd()
                  if (id) onEditingIdChange(id)
                }}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <Button
        type="button"
        variant="ghost"
        size="xs"
        onClick={async () => {
          const id = await onAdd()
          if (id) onEditingIdChange(id)
        }}
        className="mt-1.5 -ml-1.5 rounded-full text-muted-foreground hover:text-foreground"
      >
        <Plus />
        Add sub-task
      </Button>
    </div>
  )
}

function SortableSubtask({
  subtask,
  showHandle,
  isLast,
  editing,
  onEditingChange,
  onToggle,
  onRename,
  onDelete,
  onAddNext,
}: {
  subtask: Subtask
  showHandle: boolean
  isLast: boolean
  editing: boolean
  onEditingChange: (editing: boolean) => void
  onToggle: () => void
  onRename: (title: string) => void
  onDelete: () => void
  onAddNext: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: subtask.id })

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "group/subtask flex items-start gap-2 rounded-lg py-1.5 pr-1 pl-1 transition-colors hover:bg-foreground/[0.035]",
        isDragging && "relative z-10 bg-muted/80 opacity-80"
      )}
    >
      {showHandle ? (
        <button
          type="button"
          aria-label="Reorder sub-task"
          className="mt-0.5 flex size-4 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground/50 transition-colors hover:text-muted-foreground active:cursor-grabbing md:text-muted-foreground/0 md:group-hover/subtask:text-muted-foreground/70 md:group-focus-within/subtask:text-muted-foreground/70"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-3.5" />
        </button>
      ) : (
        <span className="size-4 shrink-0" aria-hidden="true" />
      )}

      <TaskCheck
        size="sm"
        checked={subtask.completed}
        label={`Mark “${subtask.title || "Untitled"}” ${subtask.completed ? "incomplete" : "complete"}`}
        onToggle={onToggle}
      />

      <EditableTitle
        value={subtask.title}
        editing={editing}
        onEditingChange={onEditingChange}
        onChange={onRename}
        onEmptyCommit={onDelete}
        onCommit={(via) => {
          if (via === "enter" && isLast) onAddNext()
        }}
        placeholder="Sub-task"
        className={cn(
          "min-w-0 flex-1 py-0.5 text-[14px] leading-snug tracking-[-0.015em]",
          subtask.completed && "text-muted-foreground line-through decoration-foreground/25"
        )}
      />

      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={`Delete sub-task ${subtask.title || "Untitled"}`}
        onClick={onDelete}
        className="rounded-full text-muted-foreground opacity-100 hover:text-foreground md:opacity-0 md:group-hover/subtask:opacity-100 md:group-focus-within/subtask:opacity-100"
      >
        <Trash2 />
      </Button>

    </li>
  )
}
