"use client"

import { useRef } from "react"

import { cn } from "@/lib/utils"

export type CommitVia = "enter" | "blur"

type EditableTitleProps = {
  value: string
  editing: boolean
  onEditingChange: (editing: boolean) => void
  onChange: (value: string) => void
  onEmptyCommit?: () => void
  onCommit?: (via: CommitVia) => void
  placeholder?: string
  className?: string
}

export function EditableTitle({
  value,
  editing,
  onEditingChange,
  onChange,
  onEmptyCommit,
  onCommit,
  placeholder = "Untitled",
  className,
}: EditableTitleProps) {
  const skipBlurRef = useRef(false)

  function commit(via: CommitVia, raw: string) {
    const next = raw.trim()

    if (!next) {
      if (onEmptyCommit) {
        onEmptyCommit()
        return
      }
      onEditingChange(false)
      return
    }

    if (next !== value) onChange(next)
    onEditingChange(false)
    onCommit?.(via)
  }

  function cancel() {
    skipBlurRef.current = true
    if (!value.trim() && onEmptyCommit) {
      onEmptyCommit()
      return
    }
    onEditingChange(false)
  }

  if (editing) {
    return (
      <input
        defaultValue={value}
        aria-label={placeholder}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        autoFocus
        onFocus={(event) => {
          skipBlurRef.current = false
          event.currentTarget.select()
        }}
        onBlur={(event) => {
          if (skipBlurRef.current) return
          commit("blur", event.currentTarget.value)
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault()
            commit("enter", event.currentTarget.value)
          }
          if (event.key === "Escape") {
            event.preventDefault()
            cancel()
          }
        }}
        className={cn(
          "w-full cursor-text bg-transparent text-left outline-none placeholder:text-muted-foreground/45",
          className
        )}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => onEditingChange(true)}
      className={cn(
        "w-full cursor-text text-left outline-none focus-visible:text-foreground",
        !value && "text-muted-foreground/45",
        className
      )}
    >
      {value || placeholder}
    </button>
  )
}
