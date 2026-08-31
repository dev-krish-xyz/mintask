"use client"

import { useSyncExternalStore } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const subscribe = () => () => {}

function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
}

export function ThemeToggle() {
  const mounted = useMounted()
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const label = isDark ? "Switch to light theme" : "Switch to dark theme"

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={label}
          disabled={!mounted}
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="rounded-full text-muted-foreground hover:text-foreground"
        >
          {!mounted ? (
            <span className="size-4" aria-hidden="true" />
          ) : isDark ? (
            <Sun />
          ) : (
            <Moon />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{mounted ? label : "Theme"}</TooltipContent>
    </Tooltip>
  )
}
