"use client"

import { useCallback, useEffect, useState } from "react"
import { arrayMove } from "@dnd-kit/sortable"

import {
  addIdeaAction,
  addSubtaskAction,
  addTaskAction,
  createWorkspaceAction,
  deleteIdeaAction,
  deleteSubtaskAction,
  deleteTaskAction,
  deleteWorkspaceAction,
  listWorkspaces,
  renameWorkspaceAction,
  reorderSubtasksAction,
  toggleSubtaskAction,
  toggleTaskAction,
  updateIdeaAction,
  updateSubtaskTitleAction,
  updateTaskTitleAction,
} from "@/actions/store"
import { todayKey } from "@/lib/dates"
import type { Task, Workspace } from "@/lib/tasks"

const EMPTY_TASKS: Task[] = []
const EMPTY_IDEAS: Workspace["ideas"] = []

export function useTasks() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [ready, setReady] = useState(false)
  const [selectedDate, setSelectedDate] = useState("")

  const activeDate = selectedDate || (ready ? todayKey() : "")
  const workspace =
    workspaces.find((item) => item.date === activeDate) ?? null
  const tasks = workspace?.tasks ?? EMPTY_TASKS
  const ideas = workspace?.ideas ?? EMPTY_IDEAS

  useEffect(() => {
    let cancelled = false

    listWorkspaces()
      .then((next) => {
        if (!cancelled) setWorkspaces(next)
      })
      .catch(() => {
        if (!cancelled) setWorkspaces([])
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const createCurrentWorkspace = useCallback(async () => {
    const date = selectedDate || todayKey()
    setWorkspaces(await createWorkspaceAction(date))
    setSelectedDate(date)
  }, [selectedDate])

  const renameWorkspace = useCallback(
    async (title: string) => {
      if (!workspace) return
      setWorkspaces(await renameWorkspaceAction(workspace.id, title))
    },
    [workspace]
  )

  const deleteWorkspace = useCallback(async () => {
    if (!workspace) return
    setWorkspaces(await deleteWorkspaceAction(workspace.id))
  }, [workspace])

  const addTask = useCallback(async () => {
    if (!workspace) return ""
    const result = await addTaskAction(workspace.id)
    setWorkspaces(result.workspaces)
    return result.id
  }, [workspace])

  const updateTaskTitle = useCallback(async (id: string, title: string) => {
    setWorkspaces(await updateTaskTitleAction(id, title))
  }, [])

  const toggleTask = useCallback(async (id: string) => {
    setWorkspaces(await toggleTaskAction(id))
  }, [])

  const deleteTask = useCallback(async (id: string) => {
    setWorkspaces(await deleteTaskAction(id))
  }, [])

  const addSubtask = useCallback(async (taskId: string) => {
    const result = await addSubtaskAction(taskId)
    setWorkspaces(result.workspaces)
    return result.id
  }, [])

  const updateSubtaskTitle = useCallback(
    async (taskId: string, subtaskId: string, title: string) => {
      setWorkspaces(await updateSubtaskTitleAction(taskId, subtaskId, title))
    },
    []
  )

  const toggleSubtask = useCallback(async (taskId: string, subtaskId: string) => {
    setWorkspaces(await toggleSubtaskAction(taskId, subtaskId))
  }, [])

  const deleteSubtask = useCallback(async (taskId: string, subtaskId: string) => {
    setWorkspaces(await deleteSubtaskAction(taskId, subtaskId))
  }, [])

  const reorderSubtasks = useCallback(
    async (taskId: string, activeId: string, overId: string) => {
      const current = tasks.find((task) => task.id === taskId)
      if (!current) return
      const oldIndex = current.subtasks.findIndex((item) => item.id === activeId)
      const newIndex = current.subtasks.findIndex((item) => item.id === overId)
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return
      const ordered = arrayMove(current.subtasks, oldIndex, newIndex).map(
        (item) => item.id
      )
      setWorkspaces(await reorderSubtasksAction(taskId, ordered))
    },
    [tasks]
  )

  const addIdea = useCallback(
    async (text: string) => {
      const date = selectedDate || todayKey()
      setWorkspaces(await addIdeaAction(date, text))
      setSelectedDate(date)
    },
    [selectedDate]
  )

  const updateIdea = useCallback(async (id: string, text: string) => {
    setWorkspaces(await updateIdeaAction(id, text))
  }, [])

  const deleteIdea = useCallback(async (id: string) => {
    setWorkspaces(await deleteIdeaAction(id))
  }, [])

  return {
    ready,
    workspaces,
    activeDate,
    setSelectedDate,
    workspace,
    tasks,
    ideas,
    createCurrentWorkspace,
    renameWorkspace,
    deleteWorkspace,
    addTask,
    updateTaskTitle,
    toggleTask,
    deleteTask,
    addSubtask,
    updateSubtaskTitle,
    toggleSubtask,
    deleteSubtask,
    reorderSubtasks,
    addIdea,
    updateIdea,
    deleteIdea,
  }
}
