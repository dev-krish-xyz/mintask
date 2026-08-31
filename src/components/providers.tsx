"use client"

import type { ReactNode } from "react"
import { ThemeProvider } from "next-themes"

import { TooltipProvider } from "@/components/ui/tooltip"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="mintask-theme"
    >
      <TooltipProvider delayDuration={400}>
        <div className="flex h-full min-h-0 flex-1 flex-col">{children}</div>
      </TooltipProvider>
    </ThemeProvider>
  )
}
