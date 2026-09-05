import { parseDateKey } from "@/lib/dates"

/**
 * TEMP mockup overlay for the activity heatmap.
 * Does not write to Neon. Remove this file and its import in
 * `month-heatmap.tsx` when the capture is done.
 */
export const SHOW_DEMO_HEATMAP = true

const LEVELS = [0, 20, 40, 65, 85, 100] as const

export function demoHeatPercent(date: string, today: string): number {
  if (date > today) return 0

  const dow = parseDateKey(date).getDay()
  const daysAgo = diffDays(date, today)
  const week = Math.floor(daysAgo / 7)
  const n = hash(date)

  // Recent stretch looks like a shipping week.
  if (daysAgo <= 16) {
    if (dow === 0 && n % 3 !== 0) return 0
    return LEVELS[3 + (n % 3)]
  }

  // A quieter patch so the grid isn't a solid block.
  if (daysAgo >= 28 && daysAgo <= 38) {
    if (dow === 0 || dow === 6) return 0
    return n % 4 === 0 ? 0 : LEVELS[1 + (n % 3)]
  }

  if (dow === 0) return n % 5 === 0 ? LEVELS[2] : 0
  if (dow === 6) return n % 3 === 0 ? LEVELS[1 + (n % 2)] : 0
  if (n % 11 === 0) return 0

  return LEVELS[Math.min(1 + ((n + week) % 5), 5)]
}

function diffDays(from: string, to: string) {
  const ms = parseDateKey(to).getTime() - parseDateKey(from).getTime()
  return Math.round(ms / 86_400_000)
}

function hash(value: string) {
  let h = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}
