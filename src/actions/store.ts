"use server"

import { auth } from "@clerk/nextjs/server"
import { and, asc, desc, eq } from "drizzle-orm"

import { getDb } from "@/db"
import { mapWorkspace } from "@/db/map"
import { ideas, subtasks, tasks, workspaces } from "@/db/schema"
import { formatWeekday } from "@/lib/dates"
import type { Workspace } from "@/lib/tasks"

async function requireUserId() {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")
  return userId
}

async function loadWorkspaces(userId: string): Promise<Workspace[]> {
  const db = getDb()
  const rows = await db.query.workspaces.findMany({
    where: eq(workspaces.userId, userId),
    with: {
      tasks: {
        with: {
          subtasks: {
            orderBy: [asc(subtasks.sortOrder)],
          },
        },
        orderBy: [desc(tasks.createdAt)],
      },
      ideas: {
        orderBy: [desc(ideas.createdAt)],
      },
    },
    orderBy: [desc(workspaces.date)],
  })

  return rows.map(mapWorkspace)
}

export async function listWorkspaces(): Promise<Workspace[]> {
  const userId = await requireUserId()
  return loadWorkspaces(userId)
}

async function ownedWorkspace(userId: string, workspaceId: string) {
  const db = getDb()
  const row = await db.query.workspaces.findFirst({
    where: and(eq(workspaces.id, workspaceId), eq(workspaces.userId, userId)),
  })
  if (!row) throw new Error("Workspace not found")
  return row
}

async function getOrCreateWorkspace(userId: string, date: string) {
  const db = getDb()
  const existing = await db.query.workspaces.findFirst({
    where: and(eq(workspaces.userId, userId), eq(workspaces.date, date)),
  })
  if (existing) return existing

  const [created] = await db
    .insert(workspaces)
    .values({
      userId,
      date,
      title: formatWeekday(date),
    })
    .returning()

  return created
}

export async function createWorkspaceAction(date: string) {
  const userId = await requireUserId()
  await getOrCreateWorkspace(userId, date)
  return loadWorkspaces(userId)
}

export async function renameWorkspaceAction(workspaceId: string, title: string) {
  const userId = await requireUserId()
  await ownedWorkspace(userId, workspaceId)
  const next = title.trim()
  if (!next) return loadWorkspaces(userId)

  await getDb()
    .update(workspaces)
    .set({ title: next })
    .where(and(eq(workspaces.id, workspaceId), eq(workspaces.userId, userId)))

  return loadWorkspaces(userId)
}

export async function deleteWorkspaceAction(workspaceId: string) {
  const userId = await requireUserId()
  await ownedWorkspace(userId, workspaceId)
  await getDb()
    .delete(workspaces)
    .where(and(eq(workspaces.id, workspaceId), eq(workspaces.userId, userId)))
  return loadWorkspaces(userId)
}

export async function addTaskAction(workspaceId: string) {
  const userId = await requireUserId()
  await ownedWorkspace(userId, workspaceId)
  const id = crypto.randomUUID()
  await getDb().insert(tasks).values({
    id,
    workspaceId,
    title: "",
    completed: false,
  })
  return { id, workspaces: await loadWorkspaces(userId) }
}

export async function updateTaskTitleAction(taskId: string, title: string) {
  const userId = await requireUserId()
  const db = getDb()
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
    with: { workspace: true },
  })
  if (!task || task.workspace.userId !== userId) throw new Error("Task not found")

  await db.update(tasks).set({ title }).where(eq(tasks.id, taskId))
  return loadWorkspaces(userId)
}

export async function toggleTaskAction(taskId: string) {
  const userId = await requireUserId()
  const db = getDb()
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
    with: { workspace: true, subtasks: true },
  })
  if (!task || task.workspace.userId !== userId) throw new Error("Task not found")

  if (task.subtasks.length === 0) {
    await db
      .update(tasks)
      .set({ completed: !task.completed })
      .where(eq(tasks.id, taskId))
  } else {
    const completed = !task.subtasks.every((item) => item.completed)
    await db.update(tasks).set({ completed }).where(eq(tasks.id, taskId))
    await db
      .update(subtasks)
      .set({ completed })
      .where(eq(subtasks.taskId, taskId))
  }

  return loadWorkspaces(userId)
}

export async function deleteTaskAction(taskId: string) {
  const userId = await requireUserId()
  const db = getDb()
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
    with: { workspace: true },
  })
  if (!task || task.workspace.userId !== userId) throw new Error("Task not found")
  await db.delete(tasks).where(eq(tasks.id, taskId))
  return loadWorkspaces(userId)
}

export async function addSubtaskAction(taskId: string) {
  const userId = await requireUserId()
  const db = getDb()
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
    with: { workspace: true, subtasks: true },
  })
  if (!task || task.workspace.userId !== userId) throw new Error("Task not found")

  const id = crypto.randomUUID()
  const sortOrder = task.subtasks.length
  await db.insert(subtasks).values({
    id,
    taskId,
    title: "",
    completed: false,
    sortOrder,
  })
  await db.update(tasks).set({ completed: false }).where(eq(tasks.id, taskId))
  return { id, workspaces: await loadWorkspaces(userId) }
}

export async function updateSubtaskTitleAction(
  taskId: string,
  subtaskId: string,
  title: string
) {
  const userId = await requireUserId()
  const db = getDb()
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
    with: { workspace: true },
  })
  if (!task || task.workspace.userId !== userId) throw new Error("Task not found")
  await db.update(subtasks).set({ title }).where(eq(subtasks.id, subtaskId))
  return loadWorkspaces(userId)
}

export async function toggleSubtaskAction(taskId: string, subtaskId: string) {
  const userId = await requireUserId()
  const db = getDb()
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
    with: { workspace: true, subtasks: true },
  })
  if (!task || task.workspace.userId !== userId) throw new Error("Task not found")

  const current = task.subtasks.find((item) => item.id === subtaskId)
  if (!current) throw new Error("Subtask not found")

  await db
    .update(subtasks)
    .set({ completed: !current.completed })
    .where(eq(subtasks.id, subtaskId))

  const nextSubtasks = task.subtasks.map((item) =>
    item.id === subtaskId ? { ...item, completed: !item.completed } : item
  )
  const completed =
    nextSubtasks.length > 0 && nextSubtasks.every((item) => item.completed)
  await db.update(tasks).set({ completed }).where(eq(tasks.id, taskId))

  return loadWorkspaces(userId)
}

export async function deleteSubtaskAction(taskId: string, subtaskId: string) {
  const userId = await requireUserId()
  const db = getDb()
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
    with: { workspace: true, subtasks: true },
  })
  if (!task || task.workspace.userId !== userId) throw new Error("Task not found")

  await db.delete(subtasks).where(eq(subtasks.id, subtaskId))
  const remaining = task.subtasks.filter((item) => item.id !== subtaskId)
  const completed =
    remaining.length > 0
      ? remaining.every((item) => item.completed)
      : task.completed
  await db.update(tasks).set({ completed }).where(eq(tasks.id, taskId))

  return loadWorkspaces(userId)
}

export async function reorderSubtasksAction(
  taskId: string,
  orderedIds: string[]
) {
  const userId = await requireUserId()
  const db = getDb()
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
    with: { workspace: true },
  })
  if (!task || task.workspace.userId !== userId) throw new Error("Task not found")

  await Promise.all(
    orderedIds.map((id, index) =>
      db.update(subtasks).set({ sortOrder: index }).where(eq(subtasks.id, id))
    )
  )

  return loadWorkspaces(userId)
}

export async function addIdeaAction(date: string, text: string) {
  const userId = await requireUserId()
  const trimmed = text.trim()
  if (!trimmed) return loadWorkspaces(userId)

  const workspace = await getOrCreateWorkspace(userId, date)
  await getDb().insert(ideas).values({
    workspaceId: workspace.id,
    text: trimmed,
  })
  return loadWorkspaces(userId)
}

export async function updateIdeaAction(ideaId: string, text: string) {
  const userId = await requireUserId()
  const db = getDb()
  const idea = await db.query.ideas.findFirst({
    where: eq(ideas.id, ideaId),
    with: { workspace: true },
  })
  if (!idea || idea.workspace.userId !== userId) throw new Error("Idea not found")

  const trimmed = text.trim()
  if (!trimmed) {
    await db.delete(ideas).where(eq(ideas.id, ideaId))
  } else {
    await db.update(ideas).set({ text: trimmed }).where(eq(ideas.id, ideaId))
  }

  return loadWorkspaces(userId)
}

export async function deleteIdeaAction(ideaId: string) {
  const userId = await requireUserId()
  const db = getDb()
  const idea = await db.query.ideas.findFirst({
    where: eq(ideas.id, ideaId),
    with: { workspace: true },
  })
  if (!idea || idea.workspace.userId !== userId) throw new Error("Idea not found")
  await db.delete(ideas).where(eq(ideas.id, ideaId))
  return loadWorkspaces(userId)
}
