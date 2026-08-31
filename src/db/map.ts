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
  workspaceId: string
  text: string
  createdAt: Date
}

export function assembleWorkspaces(
  workspaceRows: WorkspaceRow[],
  taskRows: TaskRow[],
  subtaskRows: SubtaskRow[],
  ideaRows: IdeaRow[]
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
    }
    const list = tasksByWorkspace.get(row.workspaceId)
    if (list) list.push(mapped)
    else tasksByWorkspace.set(row.workspaceId, [mapped])
  }

  const ideasByWorkspace = new Map<string, Idea[]>()
  const sortedIdeas = ideaRows
    .slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  for (const row of sortedIdeas) {
    const mapped: Idea = {
      id: row.id,
      text: row.text,
      createdAt: row.createdAt.getTime(),
    }
    const list = ideasByWorkspace.get(row.workspaceId)
    if (list) list.push(mapped)
    else ideasByWorkspace.set(row.workspaceId, [mapped])
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
      ideas: ideasByWorkspace.get(row.id) ?? [],
    }))
}
