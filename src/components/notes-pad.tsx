"use client"

import { useRef } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"

type NotesPadProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (text: string) => void
}

export function NotesPad({ open, onOpenChange, onSave }: NotesPadProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function save() {
    const text = textareaRef.current?.value ?? ""
    if (!text.trim()) {
      onOpenChange(false)
      return
    }
    onSave(text)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[min(100%-2rem,540px)] gap-3 rounded-2xl p-5 sm:max-w-[540px] sm:p-6"
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          textareaRef.current?.focus()
        }}
      >
        <DialogTitle className="text-[13px] font-medium tracking-[0.04em] text-muted-foreground uppercase">
          Quick note
        </DialogTitle>
        <DialogDescription className="sr-only">
          Write a thought and press Return to save it to Ideas.
        </DialogDescription>
        <textarea
          ref={textareaRef}
          rows={5}
          placeholder="What's on your mind?"
          className="min-h-[140px] w-full resize-none bg-transparent text-[17px] leading-relaxed tracking-[-0.02em] text-foreground outline-none placeholder:text-muted-foreground/50"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              save()
            }
          }}
        />
        <p className="text-[11px] text-muted-foreground">
          Return to save · Shift+Return for a new line
        </p>
      </DialogContent>
    </Dialog>
  )
}
