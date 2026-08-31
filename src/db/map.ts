import type { Idea, Subtask, Task, Workspace } from "@/lib/tasks"

type SubtaskRow = {
  id: string
  title: string
  completed: boolean
  sortOrder: number
}

type TaskRow = {
  id: string
  title: string
  completed: boolean
  createdAt: Date
  subtasks: SubtaskRow[]
}

type IdeaRow = {
  id: string
  text: string
  createdAt: Date
}

type WorkspaceRow = {
  id: string
  date: string
  title: string
  createdAt: Date
  tasks: TaskRow[]
  ideas: IdeaRow[]
}

export function mapWorkspace(row: WorkspaceRow): Workspace {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    createdAt: row.createdAt.getTime(),
    tasks: row.tasks
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(mapTask),
    ideas: row.ideas
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(mapIdea),
  }
}

function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    completed: row.completed,
    createdAt: row.createdAt.getTime(),
    subtasks: row.subtasks
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(mapSubtask),
  }
}

function mapSubtask(row: SubtaskRow): Subtask {
  return {
    id: row.id,
    title: row.title,
    completed: row.completed,
  }
}

function mapIdea(row: IdeaRow): Idea {
  return {
    id: row.id,
    text: row.text,
    createdAt: row.createdAt.getTime(),
  }
}
