"use client"

import { cn } from "@/lib/utils"

type TaskCheckProps = {
  checked: boolean
  label: string
  onToggle: () => void
  size?: "sm" | "md"
}

export function TaskCheck({
  checked,
  label,
  onToggle,
  size = "md",
}: TaskCheckProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      className={cn(
        "mt-0.5 flex shrink-0 items-center justify-center rounded-full border-[1.5px] transition-[background-color,border-color,transform,color] duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "active:scale-90",
        size === "md" ? "size-5" : "size-[18px]",
        checked
          ? "border-foreground bg-foreground text-background"
          : "border-foreground/22 bg-transparent text-transparent hover:border-foreground/50"
      )}
    >
      <svg
        viewBox="0 0 16 16"
        aria-hidden="true"
        className={cn(
          "transition-transform duration-200 ease-out",
          size === "md" ? "size-2.5" : "size-2",
          checked ? "scale-100" : "scale-75"
        )}
      >
        <path
          d="M3.5 8.4 6.6 11.4 12.6 4.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
