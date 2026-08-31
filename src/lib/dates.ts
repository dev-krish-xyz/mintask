export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function todayKey(): string {
  return toDateKey(new Date())
}

export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function isDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export function formatWeekday(key: string): string {
  return parseDateKey(key).toLocaleDateString(undefined, { weekday: "long" })
}

export function formatLongDate(key: string): string {
  return parseDateKey(key).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
}

export function formatShortDate(key: string): string {
  return parseDateKey(key).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

export function formatMonthYear(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  })
}

export function getMonthGrid(year: number, month: number): (string | null)[] {
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (string | null)[] = []

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push(null)
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(toDateKey(new Date(year, month, day)))
  }

  return cells
}

export const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"] as const

export function formatMonthYearFromKey(key: string): string {
  return parseDateKey(key).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  })
}
