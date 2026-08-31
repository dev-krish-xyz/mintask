import { todayKey } from "@/lib/dates"
import { createWorkspace, isTask, parseWorkspace, type Task, type Workspace } from "@/lib/tasks"

export type Store = {
  version: 2
  workspaces: Workspace[]
}

const V1_KEY = "mintask:v1"
const STORAGE_KEY = "mintask:v2"
const CHANGE_EVENT = "mintask:change"

const EMPTY_STORE: Store = { version: 2, workspaces: [] }

let memorySnapshot: string | null = null

export function getStoreSnapshot(): string {
  if (memorySnapshot !== null) return memorySnapshot

  try {
    const v2 = localStorage.getItem(STORAGE_KEY)
    if (v2) {
      memorySnapshot = JSON.stringify(parseStore(v2))
      return memorySnapshot
    }

    const v1 = localStorage.getItem(V1_KEY)
    if (v1) {
      const migrated = migrateV1(v1)
      memorySnapshot = JSON.stringify(migrated)
      localStorage.setItem(STORAGE_KEY, memorySnapshot)
      return memorySnapshot
    }
  } catch {
    memorySnapshot = JSON.stringify(EMPTY_STORE)
    return memorySnapshot
  }

  memorySnapshot = JSON.stringify(EMPTY_STORE)
  return memorySnapshot
}

export function getServerStoreSnapshot(): string {
  return JSON.stringify(EMPTY_STORE)
}

export function subscribeToStore(onStoreChange: () => void) {
  const handler = () => onStoreChange()
  window.addEventListener(CHANGE_EVENT, handler)
  window.addEventListener("storage", handler)
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler)
    window.removeEventListener("storage", handler)
  }
}

export function parseStore(raw: string): Store {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return EMPTY_STORE

    const store = parsed as Partial<Store>
    if (store.version !== 2 || !Array.isArray(store.workspaces)) {
      return EMPTY_STORE
    }

    return {
      version: 2,
      workspaces: store.workspaces
        .map(parseWorkspace)
        .filter((workspace): workspace is Workspace => workspace !== null),
    }
  } catch {
    return EMPTY_STORE
  }
}

export function writeStore(store: Store) {
  memorySnapshot = JSON.stringify(store)

  try {
    localStorage.setItem(STORAGE_KEY, memorySnapshot)
  } catch {
    // Private browsing, quota, or disabled storage.
  }

  window.dispatchEvent(new Event(CHANGE_EVENT))
}

function migrateV1(raw: string): Store {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return EMPTY_STORE

    const tasks = parsed.filter(isTask) as Task[]
    if (tasks.length === 0) return EMPTY_STORE

    return {
      version: 2,
      workspaces: [createWorkspace(todayKey(), tasks)],
    }
  } catch {
    return EMPTY_STORE
  }
}
