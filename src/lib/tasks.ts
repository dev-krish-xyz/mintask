import { formatWeekday } from "@/lib/dates"

export type Subtask = {
  id: string
  title: string
  completed: boolean
}

export type Task = {
  id: string
  title: string
  completed: boolean
  subtasks: Subtask[]
  createdAt: number
}

export type Idea = {
  id: string
  text: string
  createdAt: number
}

export type Workspace = {
  id: string
  date: string
  title: string
  createdAt: number
  tasks: Task[]
  ideas: Idea[]
}

export type TaskProgress = {
  completedCount: number
  total: number
  percent: number
  isComplete: boolean
  hasSubtasks: boolean
}

export type DayProgress = {
  percent: number
  taskCompleted: number
  taskTotal: number
  leafCompleted: number
  leafTotal: number
}

export function createTask(): Task {
  return {
    id: crypto.randomUUID(),
    title: "",
    completed: false,
    subtasks: [],
    createdAt: Date.now(),
  }
}

export function createSubtask(): Subtask {
  return {
    id: crypto.randomUUID(),
    title: "",
    completed: false,
  }
}

export function createWorkspace(
  date: string,
  tasks: Task[] = [],
  ideas: Idea[] = []
): Workspace {
  return {
    id: crypto.randomUUID(),
    date,
    title: formatWeekday(date),
    createdAt: Date.now(),
    tasks,
    ideas,
  }
}

export function createIdea(text: string): Idea {
  return {
    id: crypto.randomUUID(),
    text,
    createdAt: Date.now(),
  }
}

export function getTaskProgress(task: Task): TaskProgress {
  const hasSubtasks = task.subtasks.length > 0

  if (!hasSubtasks) {
    return {
      completedCount: task.completed ? 1 : 0,
      total: 0,
      percent: task.completed ? 100 : 0,
      isComplete: task.completed,
      hasSubtasks: false,
    }
  }

  const completedCount = task.subtasks.filter((subtask) => subtask.completed).length
  const total = task.subtasks.length
  const percent = Math.round((completedCount / total) * 100)

  return {
    completedCount,
    total,
    percent,
    isComplete: completedCount === total,
    hasSubtasks: true,
  }
}

export function getDayProgress(tasks: Task[]): DayProgress {
  const taskTotal = tasks.length
  const taskCompleted = tasks.filter((task) => getTaskProgress(task).isComplete).length

  let leafTotal = 0
  let leafCompleted = 0

  for (const task of tasks) {
    if (task.subtasks.length === 0) {
      leafTotal += 1
      if (task.completed) leafCompleted += 1
      continue
    }

    leafTotal += task.subtasks.length
    leafCompleted += task.subtasks.filter((subtask) => subtask.completed).length
  }

  return {
    taskTotal,
    taskCompleted,
    leafTotal,
    leafCompleted,
    percent: leafTotal === 0 ? 0 : Math.round((leafCompleted / leafTotal) * 100),
  }
}

export function parseWorkspace(value: unknown): Workspace | null {
  if (!value || typeof value !== "object") return null

  const workspace = value as Partial<Workspace>
  if (typeof workspace.id !== "string") return null
  if (typeof workspace.date !== "string") return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(workspace.date)) return null
  if (typeof workspace.title !== "string") return null
  if (typeof workspace.createdAt !== "number") return null
  if (!Array.isArray(workspace.tasks)) return null
  if (!workspace.tasks.every(isTask)) return null

  const ideas = Array.isArray(workspace.ideas)
    ? workspace.ideas.filter(isIdea)
    : []

  return {
    id: workspace.id,
    date: workspace.date,
    title: workspace.title,
    createdAt: workspace.createdAt,
    tasks: workspace.tasks,
    ideas,
  }
}

export function isWorkspace(value: unknown): value is Workspace {
  return parseWorkspace(value) !== null
}

function isIdea(value: unknown): value is Idea {
  if (!value || typeof value !== "object") return false

  const idea = value as Partial<Idea>
  return (
    typeof idea.id === "string" &&
    typeof idea.text === "string" &&
    typeof idea.createdAt === "number"
  )
}

export function isTask(value: unknown): value is Task {
  if (!value || typeof value !== "object") return false

  const task = value as Partial<Task>
  if (typeof task.id !== "string") return false
  if (typeof task.title !== "string") return false
  if (typeof task.completed !== "boolean") return false
  if (typeof task.createdAt !== "number") return false
  if (!Array.isArray(task.subtasks)) return false

  return task.subtasks.every(isSubtask)
}

function isSubtask(value: unknown): value is Subtask {
  if (!value || typeof value !== "object") return false

  const subtask = value as Partial<Subtask>
  return (
    typeof subtask.id === "string" &&
    typeof subtask.title === "string" &&
    typeof subtask.completed === "boolean"
  )
}
