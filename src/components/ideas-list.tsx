"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { Idea } from "@/lib/tasks"
import { surfaceClass } from "@/lib/surface"
import { cn } from "@/lib/utils"

type IdeasListProps = {
  ideas: Idea[]
  onUpdate: (id: string, text: string) => void
  onDelete: (id: string) => void
  onCapture: () => void
  className?: string
}

export function IdeasList({
  ideas,
  onUpdate,
  onDelete,
  onCapture,
  className,
}: IdeasListProps) {
  return (
    <section
      className={cn(surfaceClass, "flex min-h-0 flex-col", className)}
    >
      <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-2.5">
        <h2 className="text-[11px] font-medium tracking-[0.04em] text-muted-foreground uppercase">
          Ideas
        </h2>
        <button
          type="button"
          onClick={onCapture}
          className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
        >
          ⌘I
        </button>
      </div>

      {ideas.length === 0 ? (
        <button
          type="button"
          onClick={onCapture}
          className="flex flex-1 items-center px-5 pb-5 text-left"
        >
          <p className="max-w-[16rem] text-[13.5px] leading-relaxed text-muted-foreground">
            Capture a thought. Press ⌘I and hit Return to save it here.
          </p>
        </button>
      ) : (
        <ul className="no-scrollbar min-h-0 flex-1 divide-y divide-border/70 overflow-hidden overscroll-none @min-[860px]/main:overflow-y-auto @min-[860px]/main:overscroll-contain">
          {ideas.map((idea) => (
            <IdeaItem
              key={idea.id}
              idea={idea}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

function IdeaItem({
  idea,
  onUpdate,
  onDelete,
}: {
  idea: Idea
  onUpdate: (id: string, text: string) => void
  onDelete: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)

  return (
    <li className="group/idea flex items-start gap-2 px-5 py-3">
      {editing ? (
        <textarea
          autoFocus
          defaultValue={idea.text}
          rows={3}
          className="min-h-[64px] w-full resize-none bg-transparent text-[14px] leading-relaxed tracking-[-0.015em] text-foreground outline-none"
          onFocus={(event) => event.currentTarget.select()}
          onBlur={(event) => {
            onUpdate(idea.id, event.currentTarget.value)
            setEditing(false)
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              event.currentTarget.blur()
            }
            if (event.key === "Escape") {
              event.preventDefault()
              setEditing(false)
            }
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="whitespace-pre-wrap text-[14px] leading-relaxed tracking-[-0.015em] text-foreground">
            {idea.text}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {formatTime(idea.createdAt)}
          </p>
        </button>
      )}

      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label="Delete idea"
        onClick={() => onDelete(idea.id)}
        className="mt-0.5 rounded-full text-muted-foreground opacity-100 hover:text-foreground md:opacity-0 md:group-hover/idea:opacity-100 md:group-focus-within/idea:opacity-100"
      >
        <Trash2 />
      </Button>
    </li>
  )
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })
}
