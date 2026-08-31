"use server"

import { auth } from "@clerk/nextjs/server"
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm"

import { getDb } from "@/db"
import { assembleWorkspaces } from "@/db/map"
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
  const workspaceRows = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.userId, userId))
    .orderBy(desc(workspaces.date))

  if (workspaceRows.length === 0) return []

  const workspaceIds = workspaceRows.map((row) => row.id)
  const [taskRows, ideaRows] = await Promise.all([
    db
      .select()
      .from(tasks)
      .where(inArray(tasks.workspaceId, workspaceIds))
      .orderBy(desc(tasks.createdAt)),
    db
      .select()
      .from(ideas)
      .where(inArray(ideas.workspaceId, workspaceIds))
      .orderBy(desc(ideas.createdAt)),
  ])

  const taskIds = taskRows.map((row) => row.id)
  const subtaskRows =
    taskIds.length === 0
      ? []
      : await db
          .select()
          .from(subtasks)
          .where(inArray(subtasks.taskId, taskIds))
          .orderBy(asc(subtasks.sortOrder))

  return assembleWorkspaces(workspaceRows, taskRows, subtaskRows, ideaRows)
}

export async function listWorkspaces(): Promise<Workspace[]> {
  const userId = await requireUserId()
  return loadWorkspaces(userId)
}

async function ownedWorkspace(userId: string, workspaceId: string) {
  const [row] = await getDb()
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(and(eq(workspaces.id, workspaceId), eq(workspaces.userId, userId)))
    .limit(1)
  if (!row) throw new Error("Workspace not found")
  return row
}

async function ownedTask(userId: string, taskId: string) {
  const [row] = await getDb()
    .select({
      id: tasks.id,
      workspaceId: tasks.workspaceId,
      completed: tasks.completed,
    })
    .from(tasks)
    .innerJoin(workspaces, eq(workspaces.id, tasks.workspaceId))
    .where(and(eq(tasks.id, taskId), eq(workspaces.userId, userId)))
    .limit(1)
  if (!row) throw new Error("Task not found")
  return row
}

async function ownedIdea(userId: string, ideaId: string) {
  const [row] = await getDb()
    .select({ id: ideas.id })
    .from(ideas)
    .innerJoin(workspaces, eq(workspaces.id, ideas.workspaceId))
    .where(and(eq(ideas.id, ideaId), eq(workspaces.userId, userId)))
    .limit(1)
  if (!row) throw new Error("Idea not found")
  return row
}

async function getOrCreateWorkspace(
  userId: string,
  date: string,
  id?: string
) {
  const db = getDb()
  const [existing] = await db
    .select()
    .from(workspaces)
    .where(and(eq(workspaces.userId, userId), eq(workspaces.date, date)))
    .limit(1)
  if (existing) return existing

  const [created] = await db
    .insert(workspaces)
    .values({
      id: id ?? crypto.randomUUID(),
      userId,
      date,
      title: formatWeekday(date),
    })
    .onConflictDoNothing({ target: [workspaces.userId, workspaces.date] })
    .returning()

  if (created) return created

  const [again] = await db
    .select()
    .from(workspaces)
    .where(and(eq(workspaces.userId, userId), eq(workspaces.date, date)))
    .limit(1)
  if (!again) throw new Error("Workspace not found")
  return again
}

export async function createWorkspaceAction(date: string, id: string) {
  const userId = await requireUserId()
  await getOrCreateWorkspace(userId, date, id)
}

export async function renameWorkspaceAction(workspaceId: string, title: string) {
  const userId = await requireUserId()
  const next = title.trim()
  if (!next) return

  await getDb()
    .update(workspaces)
    .set({ title: next })
    .where(and(eq(workspaces.id, workspaceId), eq(workspaces.userId, userId)))
}

export async function deleteWorkspaceAction(workspaceId: string) {
  const userId = await requireUserId()
  await getDb()
    .delete(workspaces)
    .where(and(eq(workspaces.id, workspaceId), eq(workspaces.userId, userId)))
}

export async function addTaskAction(workspaceId: string, id: string) {
  const userId = await requireUserId()
  await ownedWorkspace(userId, workspaceId)
  await getDb().insert(tasks).values({
    id,
    workspaceId,
    title: "",
    completed: false,
  })
}

export async function updateTaskTitleAction(taskId: string, title: string) {
  const userId = await requireUserId()
  await ownedTask(userId, taskId)
  await getDb().update(tasks).set({ title }).where(eq(tasks.id, taskId))
}

export async function toggleTaskAction(
  taskId: string,
  completed: boolean,
  syncSubtasks: boolean
) {
  const userId = await requireUserId()
  await ownedTask(userId, taskId)
  const db = getDb()
  await db.update(tasks).set({ completed }).where(eq(tasks.id, taskId))
  if (syncSubtasks) {
    await db.update(subtasks).set({ completed }).where(eq(subtasks.taskId, taskId))
  }
}

export async function deleteTaskAction(taskId: string) {
  const userId = await requireUserId()
  await ownedTask(userId, taskId)
  await getDb().delete(tasks).where(eq(tasks.id, taskId))
}

export async function addSubtaskAction(
  taskId: string,
  id: string,
  sortOrder: number
) {
  const userId = await requireUserId()
  await ownedTask(userId, taskId)
  const db = getDb()
  await db.insert(subtasks).values({
    id,
    taskId,
    title: "",
    completed: false,
    sortOrder,
  })
  await db.update(tasks).set({ completed: false }).where(eq(tasks.id, taskId))
}

export async function updateSubtaskTitleAction(
  taskId: string,
  subtaskId: string,
  title: string
) {
  const userId = await requireUserId()
  await ownedTask(userId, taskId)
  await getDb().update(subtasks).set({ title }).where(eq(subtasks.id, subtaskId))
}

export async function toggleSubtaskAction(
  taskId: string,
  subtaskId: string,
  subtaskCompleted: boolean,
  taskCompleted: boolean
) {
  const userId = await requireUserId()
  await ownedTask(userId, taskId)
  const db = getDb()
  await db
    .update(subtasks)
    .set({ completed: subtaskCompleted })
    .where(eq(subtasks.id, subtaskId))
  await db.update(tasks).set({ completed: taskCompleted }).where(eq(tasks.id, taskId))
}

export async function deleteSubtaskAction(
  taskId: string,
  subtaskId: string,
  taskCompleted: boolean
) {
  const userId = await requireUserId()
  await ownedTask(userId, taskId)
  const db = getDb()
  await db.delete(subtasks).where(eq(subtasks.id, subtaskId))
  await db.update(tasks).set({ completed: taskCompleted }).where(eq(tasks.id, taskId))
}

export async function reorderSubtasksAction(
  taskId: string,
  orderedIds: string[]
) {
  const userId = await requireUserId()
  await ownedTask(userId, taskId)
  if (orderedIds.length === 0) return

  await getDb().execute(sql`
    UPDATE subtasks AS s
    SET sort_order = v.sort_order::int
    FROM (
      VALUES ${sql.join(
        orderedIds.map((id, index) => sql`(${id}::uuid, ${index})`),
        sql`, `
      )}
    ) AS v(id, sort_order)
    WHERE s.id = v.id AND s.task_id = ${taskId}::uuid
  `)
}

export async function addIdeaAction(
  date: string,
  text: string,
  id: string,
  workspaceId?: string
) {
  const userId = await requireUserId()
  const trimmed = text.trim()
  if (!trimmed) return

  const workspace = await getOrCreateWorkspace(userId, date, workspaceId)
  await getDb().insert(ideas).values({
    id,
    workspaceId: workspace.id,
    text: trimmed,
  })
}

export async function updateIdeaAction(ideaId: string, text: string) {
  const userId = await requireUserId()
  await ownedIdea(userId, ideaId)
  const trimmed = text.trim()
  const db = getDb()
  if (!trimmed) {
    await db.delete(ideas).where(eq(ideas.id, ideaId))
    return
  }
  await db.update(ideas).set({ text: trimmed }).where(eq(ideas.id, ideaId))
}

export async function deleteIdeaAction(ideaId: string) {
  const userId = await requireUserId()
  await ownedIdea(userId, ideaId)
  await getDb().delete(ideas).where(eq(ideas.id, ideaId))
}
