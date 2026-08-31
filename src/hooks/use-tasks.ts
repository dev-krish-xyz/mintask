"use client"

import { useCallback, useMemo, useState, useSyncExternalStore } from "react"
import { arrayMove } from "@dnd-kit/sortable"

import { todayKey } from "@/lib/dates"
import {
  getServerStoreSnapshot,
  getStoreSnapshot,
  parseStore,
  subscribeToStore,
  writeStore,
} from "@/lib/storage"
import {
  createIdea,
  createSubtask,
  createTask,
  createWorkspace,
  type Task,
  type Workspace,
} from "@/lib/tasks"

const subscribeToIsClient = () => () => {}

function useIsClient() {
  return useSyncExternalStore(
    subscribeToIsClient,
    () => true,
    () => false
  )
}

export function useTasks() {
  const ready = useIsClient()
  const raw = useSyncExternalStore(
    subscribeToStore,
    getStoreSnapshot,
    getServerStoreSnapshot
  )
  const [selectedDate, setSelectedDate] = useState("")

  const store = useMemo(() => parseStore(raw), [raw])
  const workspaces = store.workspaces
  const activeDate = selectedDate || (ready ? todayKey() : "")

  const workspace =
    workspaces.find((item) => item.date === activeDate) ?? null

  const tasks = workspace?.tasks ?? []
  const ideas = workspace?.ideas ?? []

  const update = useCallback((updater: (current: Workspace[]) => Workspace[]) => {
    const current = parseStore(getStoreSnapshot())
    writeStore({ version: 2, workspaces: updater(current.workspaces) })
  }, [])

  const createCurrentWorkspace = useCallback(() => {
    const date = selectedDate || todayKey()

    update((current) => {
      if (current.some((item) => item.date === date)) return current
      return [...current, createWorkspace(date)]
    })

    setSelectedDate(date)
  }, [selectedDate, update])

  const renameWorkspace = useCallback(
    (title: string) => {
      if (!workspace) return
      update((current) =>
        current.map((item) =>
          item.id === workspace.id ? { ...item, title } : item
        )
      )
    },
    [update, workspace]
  )

  const deleteWorkspace = useCallback(() => {
    if (!workspace) return
    update((current) => current.filter((item) => item.id !== workspace.id))
  }, [update, workspace])

  const updateTasks = useCallback(
    (updater: (current: Task[]) => Task[]) => {
      if (!workspace) return
      const workspaceId = workspace.id
      update((current) =>
        current.map((item) =>
          item.id === workspaceId
            ? { ...item, tasks: updater(item.tasks) }
            : item
        )
      )
    },
    [update, workspace]
  )

  const addIdea = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return

      const date = selectedDate || todayKey()
      const idea = createIdea(trimmed)

      update((current) => {
        const existing = current.find((item) => item.date === date)
        if (existing) {
          return current.map((item) =>
            item.id === existing.id
              ? { ...item, ideas: [idea, ...item.ideas] }
              : item
          )
        }

        return [...current, createWorkspace(date, [], [idea])]
      })

      setSelectedDate(date)
    },
    [selectedDate, update]
  )

  const updateIdea = useCallback(
    (id: string, text: string) => {
      if (!workspace) return
      const trimmed = text.trim()
      const workspaceId = workspace.id

      update((current) =>
        current.map((item) => {
          if (item.id !== workspaceId) return item
          if (!trimmed) {
            return {
              ...item,
              ideas: item.ideas.filter((idea) => idea.id !== id),
            }
          }
          return {
            ...item,
            ideas: item.ideas.map((idea) =>
              idea.id === id ? { ...idea, text: trimmed } : idea
            ),
          }
        })
      )
    },
    [update, workspace]
  )

  const deleteIdea = useCallback(
    (id: string) => {
      if (!workspace) return
      const workspaceId = workspace.id
      update((current) =>
        current.map((item) =>
          item.id === workspaceId
            ? { ...item, ideas: item.ideas.filter((idea) => idea.id !== id) }
            : item
        )
      )
    },
    [update, workspace]
  )

  const addTask = useCallback(() => {
    const task = createTask()
    updateTasks((current) => [task, ...current])
    return task.id
  }, [updateTasks])

  const updateTaskTitle = useCallback(
    (id: string, title: string) => {
      updateTasks((current) =>
        current.map((task) => (task.id === id ? { ...task, title } : task))
      )
    },
    [updateTasks]
  )

  const toggleTask = useCallback(
    (id: string) => {
      updateTasks((current) =>
        current.map((task) => {
          if (task.id !== id) return task

          if (task.subtasks.length === 0) {
            return { ...task, completed: !task.completed }
          }

          const allDone = task.subtasks.every((subtask) => subtask.completed)
          const completed = !allDone

          return {
            ...task,
            completed,
            subtasks: task.subtasks.map((subtask) => ({
              ...subtask,
              completed,
            })),
          }
        })
      )
    },
    [updateTasks]
  )

  const deleteTask = useCallback(
    (id: string) => {
      updateTasks((current) => current.filter((task) => task.id !== id))
    },
    [updateTasks]
  )

  const addSubtask = useCallback(
    (taskId: string) => {
      const subtask = createSubtask()

      updateTasks((current) =>
        current.map((task) => {
          if (task.id !== taskId) return task

          return {
            ...task,
            completed: false,
            subtasks: [...task.subtasks, subtask],
          }
        })
      )

      return subtask.id
    },
    [updateTasks]
  )

  const updateSubtaskTitle = useCallback(
    (taskId: string, subtaskId: string, title: string) => {
      updateTasks((current) =>
        current.map((task) => {
          if (task.id !== taskId) return task

          return {
            ...task,
            subtasks: task.subtasks.map((subtask) =>
              subtask.id === subtaskId ? { ...subtask, title } : subtask
            ),
          }
        })
      )
    },
    [updateTasks]
  )

  const toggleSubtask = useCallback(
    (taskId: string, subtaskId: string) => {
      updateTasks((current) =>
        current.map((task) => {
          if (task.id !== taskId) return task

          const subtasks = task.subtasks.map((subtask) =>
            subtask.id === subtaskId
              ? { ...subtask, completed: !subtask.completed }
              : subtask
          )

          return {
            ...task,
            subtasks,
            completed:
              subtasks.length > 0 && subtasks.every((item) => item.completed),
          }
        })
      )
    },
    [updateTasks]
  )

  const deleteSubtask = useCallback(
    (taskId: string, subtaskId: string) => {
      updateTasks((current) =>
        current.map((task) => {
          if (task.id !== taskId) return task

          const subtasks = task.subtasks.filter(
            (subtask) => subtask.id !== subtaskId
          )
          const completed =
            subtasks.length > 0
              ? subtasks.every((subtask) => subtask.completed)
              : task.completed

          return { ...task, subtasks, completed }
        })
      )
    },
    [updateTasks]
  )

  const reorderSubtasks = useCallback(
    (taskId: string, activeId: string, overId: string) => {
      updateTasks((current) =>
        current.map((task) => {
          if (task.id !== taskId) return task

          const oldIndex = task.subtasks.findIndex(
            (subtask) => subtask.id === activeId
          )
          const newIndex = task.subtasks.findIndex(
            (subtask) => subtask.id === overId
          )
          if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
            return task
          }

          return {
            ...task,
            subtasks: arrayMove(task.subtasks, oldIndex, newIndex),
          }
        })
      )
    },
    [updateTasks]
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
