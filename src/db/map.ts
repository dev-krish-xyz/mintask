import type { Idea, Subtask, Task, Workspace } from "@/lib/tasks"

type WorkspaceRow = {
  id: string
  date: string
  title: string
  createdAt: Date
}

type TaskRow = {
  id: string
  workspaceId: string
  title: string
  completed: boolean
  createdAt: Date
  sourceTaskId: string | null
}

type SubtaskRow = {
  id: string
  taskId: string
  title: string
  completed: boolean
  sortOrder: number
}

type IdeaRow = {
  id: string
  text: string
  createdAt: Date
}

export function assembleWorkspaces(
  workspaceRows: WorkspaceRow[],
  taskRows: TaskRow[],
  subtaskRows: SubtaskRow[]
): Workspace[] {
  const subtasksByTask = new Map<string, Subtask[]>()
  const sortedSubtasks = subtaskRows
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
  for (const row of sortedSubtasks) {
    const mapped: Subtask = {
      id: row.id,
      title: row.title,
      completed: row.completed,
    }
    const list = subtasksByTask.get(row.taskId)
    if (list) list.push(mapped)
    else subtasksByTask.set(row.taskId, [mapped])
  }

  const tasksByWorkspace = new Map<string, Task[]>()
  const sortedTasks = taskRows
    .slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  for (const row of sortedTasks) {
    const mapped: Task = {
      id: row.id,
      title: row.title,
      completed: row.completed,
      createdAt: row.createdAt.getTime(),
      subtasks: subtasksByTask.get(row.id) ?? [],
      ...(row.sourceTaskId ? { sourceTaskId: row.sourceTaskId } : {}),
    }
    const list = tasksByWorkspace.get(row.workspaceId)
    if (list) list.push(mapped)
    else tasksByWorkspace.set(row.workspaceId, [mapped])
  }

  return workspaceRows
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((row) => ({
      id: row.id,
      date: row.date,
      title: row.title,
      createdAt: row.createdAt.getTime(),
      tasks: tasksByWorkspace.get(row.id) ?? [],
      ideas: [],
    }))
}

export function assembleIdeas(ideaRows: IdeaRow[]): Idea[] {
  return ideaRows
    .slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((row) => ({
      id: row.id,
      text: row.text,
      createdAt: row.createdAt.getTime(),
    }))
}
