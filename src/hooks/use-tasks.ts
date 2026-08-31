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
import {
  createIdea,
  createSubtask,
  createTask,
  createWorkspace,
  type Task,
  type Workspace,
} from "@/lib/tasks"

const EMPTY_TASKS: Task[] = []
const EMPTY_IDEAS: Workspace["ideas"] = []

function persist(run: () => Promise<unknown>, onError: () => void) {
  void run().catch(() => onError())
}

function patchWorkspace(
  workspaces: Workspace[],
  workspaceId: string,
  update: (workspace: Workspace) => Workspace
) {
  return workspaces.map((workspace) =>
    workspace.id === workspaceId ? update(workspace) : workspace
  )
}

function patchTask(
  workspace: Workspace,
  taskId: string,
  update: (task: Task) => Task
): Workspace {
  return {
    ...workspace,
    tasks: workspace.tasks.map((task) =>
      task.id === taskId ? update(task) : task
    ),
  }
}

export function useTasks() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [ready, setReady] = useState(false)
  const [selectedDate, setSelectedDate] = useState("")

  const activeDate = selectedDate || (ready ? todayKey() : "")
  const workspace =
    workspaces.find((item) => item.date === activeDate) ?? null
  const tasks = workspace?.tasks ?? EMPTY_TASKS
  const ideas = workspace?.ideas ?? EMPTY_IDEAS

  const resync = useCallback(() => {
    listWorkspaces()
      .then(setWorkspaces)
      .catch(() => setWorkspaces([]))
  }, [])

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
    const created = createWorkspace(date)
    let inserted = false

    setWorkspaces((prev) => {
      if (prev.some((item) => item.date === date)) return prev
      inserted = true
      return [created, ...prev]
    })
    setSelectedDate(date)

    if (inserted) persist(() => createWorkspaceAction(date, created.id), resync)
  }, [resync, selectedDate])

  const renameWorkspace = useCallback(
    async (title: string) => {
      if (!workspace) return
      const next = title.trim()
      if (!next) return
      const workspaceId = workspace.id
      setWorkspaces((prev) =>
        patchWorkspace(prev, workspaceId, (item) => ({ ...item, title: next }))
      )
      persist(() => renameWorkspaceAction(workspaceId, next), resync)
    },
    [resync, workspace]
  )

  const deleteWorkspace = useCallback(async () => {
    if (!workspace) return
    const workspaceId = workspace.id
    setWorkspaces((prev) => prev.filter((item) => item.id !== workspaceId))
    persist(() => deleteWorkspaceAction(workspaceId), resync)
  }, [resync, workspace])

  const addTask = useCallback(async () => {
    if (!workspace) return ""
    const workspaceId = workspace.id
    const task = createTask()
    setWorkspaces((prev) =>
      patchWorkspace(prev, workspaceId, (item) => ({
        ...item,
        tasks: [task, ...item.tasks],
      }))
    )
    persist(() => addTaskAction(workspaceId, task.id), resync)
    return task.id
  }, [resync, workspace])

  const updateTaskTitle = useCallback(
    async (id: string, title: string) => {
      setWorkspaces((prev) =>
        prev.map((item) =>
          patchTask(item, id, (task) => ({ ...task, title }))
        )
      )
      persist(() => updateTaskTitleAction(id, title), resync)
    },
    [resync]
  )

  const toggleTask = useCallback(
    async (id: string) => {
      const current = tasks.find((task) => task.id === id)
      if (!current) return
      const hasSubtasks = current.subtasks.length > 0
      const completed = hasSubtasks
        ? !current.subtasks.every((item) => item.completed)
        : !current.completed

      setWorkspaces((prev) =>
        prev.map((item) =>
          patchTask(item, id, (task) => ({
            ...task,
            completed,
            subtasks: hasSubtasks
              ? task.subtasks.map((subtask) => ({ ...subtask, completed }))
              : task.subtasks,
          }))
        )
      )
      persist(() => toggleTaskAction(id, completed, hasSubtasks), resync)
    },
    [resync, tasks]
  )

  const deleteTask = useCallback(
    async (id: string) => {
      setWorkspaces((prev) =>
        prev.map((item) => ({
          ...item,
          tasks: item.tasks.filter((task) => task.id !== id),
        }))
      )
      persist(() => deleteTaskAction(id), resync)
    },
    [resync]
  )

  const addSubtask = useCallback(
    async (taskId: string) => {
      const current = tasks.find((task) => task.id === taskId)
      const sortOrder = current?.subtasks.length ?? 0
      const subtask = createSubtask()
      setWorkspaces((prev) =>
        prev.map((item) =>
          patchTask(item, taskId, (task) => ({
            ...task,
            completed: false,
            subtasks: [...task.subtasks, subtask],
          }))
        )
      )
      persist(() => addSubtaskAction(taskId, subtask.id, sortOrder), resync)
      return subtask.id
    },
    [resync, tasks]
  )

  const updateSubtaskTitle = useCallback(
    async (taskId: string, subtaskId: string, title: string) => {
      setWorkspaces((prev) =>
        prev.map((item) =>
          patchTask(item, taskId, (task) => ({
            ...task,
            subtasks: task.subtasks.map((subtask) =>
              subtask.id === subtaskId ? { ...subtask, title } : subtask
            ),
          }))
        )
      )
      persist(
        () => updateSubtaskTitleAction(taskId, subtaskId, title),
        resync
      )
    },
    [resync]
  )

  const toggleSubtask = useCallback(
    async (taskId: string, subtaskId: string) => {
      const current = tasks.find((task) => task.id === taskId)
      const target = current?.subtasks.find((item) => item.id === subtaskId)
      if (!current || !target) return

      const subtaskCompleted = !target.completed
      const nextSubtasks = current.subtasks.map((item) =>
        item.id === subtaskId
          ? { ...item, completed: subtaskCompleted }
          : item
      )
      const taskCompleted =
        nextSubtasks.length > 0 && nextSubtasks.every((item) => item.completed)

      setWorkspaces((prev) =>
        prev.map((item) =>
          patchTask(item, taskId, (task) => ({
            ...task,
            completed: taskCompleted,
            subtasks: task.subtasks.map((subtask) =>
              subtask.id === subtaskId
                ? { ...subtask, completed: subtaskCompleted }
                : subtask
            ),
          }))
        )
      )
      persist(
        () =>
          toggleSubtaskAction(
            taskId,
            subtaskId,
            subtaskCompleted,
            taskCompleted
          ),
        resync
      )
    },
    [resync, tasks]
  )

  const deleteSubtask = useCallback(
    async (taskId: string, subtaskId: string) => {
      const current = tasks.find((task) => task.id === taskId)
      const remaining =
        current?.subtasks.filter((item) => item.id !== subtaskId) ?? []
      const taskCompleted =
        remaining.length > 0
          ? remaining.every((item) => item.completed)
          : Boolean(current?.completed)

      setWorkspaces((prev) =>
        prev.map((item) =>
          patchTask(item, taskId, (task) => ({
            ...task,
            completed: taskCompleted,
            subtasks: task.subtasks.filter(
              (subtask) => subtask.id !== subtaskId
            ),
          }))
        )
      )
      persist(
        () => deleteSubtaskAction(taskId, subtaskId, taskCompleted),
        resync
      )
    },
    [resync, tasks]
  )

  const reorderSubtasks = useCallback(
    async (taskId: string, activeId: string, overId: string) => {
      const current = tasks.find((task) => task.id === taskId)
      if (!current) return
      const oldIndex = current.subtasks.findIndex((item) => item.id === activeId)
      const newIndex = current.subtasks.findIndex((item) => item.id === overId)
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return
      const nextSubtasks = arrayMove(current.subtasks, oldIndex, newIndex)
      const ordered = nextSubtasks.map((item) => item.id)

      setWorkspaces((prev) =>
        prev.map((item) =>
          patchTask(item, taskId, (task) => ({
            ...task,
            subtasks: arrayMove(task.subtasks, oldIndex, newIndex),
          }))
        )
      )
      persist(() => reorderSubtasksAction(taskId, ordered), resync)
    },
    [resync, tasks]
  )

  const addIdea = useCallback(
    async (text: string) => {
      const date = selectedDate || todayKey()
      const trimmed = text.trim()
      if (!trimmed) return
      const idea = createIdea(trimmed)
      const existing = workspaces.find((item) => item.date === date)

      if (existing) {
        setWorkspaces((prev) =>
          patchWorkspace(prev, existing.id, (item) => ({
            ...item,
            ideas: [idea, ...item.ideas],
          }))
        )
        persist(
          () => addIdeaAction(date, trimmed, idea.id, existing.id),
          resync
        )
      } else {
        const created = createWorkspace(date, [], [idea])
        setWorkspaces((prev) => {
          if (prev.some((item) => item.date === date)) {
            const found = prev.find((item) => item.date === date)
            if (!found) return prev
            return patchWorkspace(prev, found.id, (item) => ({
              ...item,
              ideas: [idea, ...item.ideas],
            }))
          }
          return [created, ...prev]
        })
        persist(
          () => addIdeaAction(date, trimmed, idea.id, created.id),
          resync
        )
      }
      setSelectedDate(date)
    },
    [resync, selectedDate, workspaces]
  )

  const updateIdea = useCallback(
    async (id: string, text: string) => {
      const trimmed = text.trim()
      setWorkspaces((prev) =>
        prev.map((item) => ({
          ...item,
          ideas: trimmed
            ? item.ideas.map((idea) =>
                idea.id === id ? { ...idea, text: trimmed } : idea
              )
            : item.ideas.filter((idea) => idea.id !== id),
        }))
      )
      persist(() => updateIdeaAction(id, text), resync)
    },
    [resync]
  )

  const deleteIdea = useCallback(
    async (id: string) => {
      setWorkspaces((prev) =>
        prev.map((item) => ({
          ...item,
          ideas: item.ideas.filter((idea) => idea.id !== id),
        }))
      )
      persist(() => deleteIdeaAction(id), resync)
    },
    [resync]
  )

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
