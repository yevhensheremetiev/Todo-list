import type { BoardState, Column, ColumnId, Task, TaskId } from '../types/board'
import type { BoardAction } from './boardActions'

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}

export function createInitialBoardState(): BoardState {
  const todoId: ColumnId = id('col')
  const doingId: ColumnId = id('col')
  const doneId: ColumnId = id('col')

  const t1: TaskId = id('task')
  const t2: TaskId = id('task')
  const t3: TaskId = id('task')

  const now = Date.now()

  return {
    columnOrder: [todoId, doingId, doneId],
    columnsById: {
      [todoId]: { id: todoId, title: 'Todo', taskIds: [t1, t2] },
      [doingId]: { id: doingId, title: 'In progress', taskIds: [t3] },
      [doneId]: { id: doneId, title: 'Done', taskIds: [] },
    },
    tasksById: {
      [t1]: { id: t1, title: 'Add tasks (Enter)', completed: false, createdAt: now, updatedAt: now },
      [t2]: { id: t2, title: 'Multi-select and bulk move', completed: false, createdAt: now, updatedAt: now },
      [t3]: { id: t3, title: 'Drag tasks between columns', completed: true, createdAt: now, updatedAt: now },
    },
    selection: { taskIds: [] },
  }
}

function clampIndex(index: number, length: number) {
  return Math.max(0, Math.min(index, Math.max(0, length)))
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr))
}

function insertIntoArray<T>(arr: T[], index: number, value: T) {
  const i = clampIndex(index, arr.length)
  return [...arr.slice(0, i), value, ...arr.slice(i)]
}

function reorder<T>(arr: T[], fromIndex: number, toIndex: number) {
  const from = clampIndex(fromIndex, arr.length - 1)
  const without = [...arr.slice(0, from), ...arr.slice(from + 1)]
  const to = clampIndex(toIndex, without.length)
  return [...without.slice(0, to), arr[from], ...without.slice(to)]
}

function createColumn(title: string): Column {
  return { id: id('col'), title, taskIds: [] }
}

function createTask(title: string): Task {
  const now = Date.now()
  return { id: id('task'), title, completed: false, createdAt: now, updatedAt: now }
}

export function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case 'column/add': {
      const column = createColumn(action.title?.trim() || 'New column')
      return {
        ...state,
        columnOrder: [...state.columnOrder, column.id],
        columnsById: { ...state.columnsById, [column.id]: column },
      }
    }
    case 'column/delete': {
      const col = state.columnsById[action.columnId]
      if (!col) return state

      const { [action.columnId]: _deleted, ...restCols } = state.columnsById
      const nextTasksById = { ...state.tasksById }
      for (const taskId of col.taskIds) delete nextTasksById[taskId]

      const selected = new Set(state.selection.taskIds)
      for (const taskId of col.taskIds) selected.delete(taskId)

      return {
        ...state,
        columnOrder: state.columnOrder.filter((id) => id !== action.columnId),
        columnsById: restCols,
        tasksById: nextTasksById,
        selection: { taskIds: Array.from(selected) },
      }
    }
    case 'column/rename': {
      const col = state.columnsById[action.columnId]
      if (!col) return state
      const title = action.title.trim()
      if (!title) return state
      return {
        ...state,
        columnsById: { ...state.columnsById, [col.id]: { ...col, title } },
      }
    }
    case 'column/reorder': {
      return { ...state, columnOrder: action.columnOrder }
    }
    case 'task/add': {
      const col = state.columnsById[action.columnId]
      if (!col) return state
      const title = action.title.trim()
      if (!title) return state
      const task = createTask(title)
      return {
        ...state,
        tasksById: { ...state.tasksById, [task.id]: task },
        columnsById: {
          ...state.columnsById,
          [col.id]: { ...col, taskIds: [task.id, ...col.taskIds] },
        },
      }
    }
    case 'task/delete': {
      const task = state.tasksById[action.taskId]
      if (!task) return state
      const nextTasksById = { ...state.tasksById }
      delete nextTasksById[action.taskId]

      const nextColumnsById: Record<ColumnId, Column> = {}
      for (const colId of state.columnOrder) {
        const col = state.columnsById[colId]
        nextColumnsById[colId] = { ...col, taskIds: col.taskIds.filter((id) => id !== action.taskId) }
      }

      return {
        ...state,
        tasksById: nextTasksById,
        columnsById: nextColumnsById,
        selection: { taskIds: state.selection.taskIds.filter((id) => id !== action.taskId) },
      }
    }
    case 'task/toggleComplete': {
      const task = state.tasksById[action.taskId]
      if (!task) return state
      return {
        ...state,
        tasksById: {
          ...state.tasksById,
          [task.id]: { ...task, completed: !task.completed, updatedAt: Date.now() },
        },
      }
    }
    case 'task/setComplete': {
      const next = { ...state.tasksById }
      const now = Date.now()
      for (const id of action.taskIds) {
        const t = next[id]
        if (!t) continue
        next[id] = { ...t, completed: action.completed, updatedAt: now }
      }
      return { ...state, tasksById: next }
    }
    case 'task/rename': {
      const task = state.tasksById[action.taskId]
      if (!task) return state
      const title = action.title.trim()
      if (!title) return state
      return {
        ...state,
        tasksById: {
          ...state.tasksById,
          [task.id]: { ...task, title, updatedAt: Date.now() },
        },
      }
    }
    case 'task/reorderWithinColumn': {
      const col = state.columnsById[action.columnId]
      if (!col) return state
      if (col.taskIds.length < 2) return state
      const nextTaskIds = reorder(col.taskIds, action.fromIndex, action.toIndex)
      return {
        ...state,
        columnsById: { ...state.columnsById, [col.id]: { ...col, taskIds: nextTaskIds } },
      }
    }
    case 'task/move': {
      const from = state.columnsById[action.fromColumnId]
      const to = state.columnsById[action.toColumnId]
      if (!from || !to) return state
      if (!from.taskIds.includes(action.taskId)) return state

      const fromTaskIds = from.taskIds.filter((id) => id !== action.taskId)
      const toTaskIds = insertIntoArray(to.taskIds, action.toIndex, action.taskId)
      return {
        ...state,
        columnsById: {
          ...state.columnsById,
          [from.id]: { ...from, taskIds: fromTaskIds },
          [to.id]: { ...to, taskIds: toTaskIds },
        },
      }
    }
    case 'selection/set': {
      return { ...state, selection: { taskIds: unique(action.taskIds).filter((id) => !!state.tasksById[id]) } }
    }
    case 'selection/toggle': {
      const set = new Set(state.selection.taskIds)
      if (set.has(action.taskId)) set.delete(action.taskId)
      else if (state.tasksById[action.taskId]) set.add(action.taskId)
      return { ...state, selection: { taskIds: Array.from(set) } }
    }
    case 'selection/clear': {
      return { ...state, selection: { taskIds: [] } }
    }
    case 'selection/selectAllInColumn': {
      const col = state.columnsById[action.columnId]
      if (!col) return state
      return { ...state, selection: { taskIds: unique([...state.selection.taskIds, ...col.taskIds]) } }
    }
    case 'selection/deselectAllInColumn': {
      const col = state.columnsById[action.columnId]
      if (!col) return state
      const set = new Set(state.selection.taskIds)
      for (const id of col.taskIds) set.delete(id)
      return { ...state, selection: { taskIds: Array.from(set) } }
    }
    case 'bulk/deleteSelected': {
      if (state.selection.taskIds.length === 0) return state
      const deleteIds = new Set(state.selection.taskIds)
      const nextTasksById = { ...state.tasksById }
      for (const id of deleteIds) delete nextTasksById[id]

      const nextCols: Record<ColumnId, Column> = {}
      for (const colId of state.columnOrder) {
        const col = state.columnsById[colId]
        nextCols[colId] = { ...col, taskIds: col.taskIds.filter((id) => !deleteIds.has(id)) }
      }

      return { ...state, tasksById: nextTasksById, columnsById: nextCols, selection: { taskIds: [] } }
    }
    case 'bulk/moveSelected': {
      const to = state.columnsById[action.toColumnId]
      if (!to) return state
      const selected = state.selection.taskIds.filter((id) => !!state.tasksById[id])
      if (selected.length === 0) return state

      const selectedSet = new Set(selected)
      const nextCols: Record<ColumnId, Column> = {}
      for (const colId of state.columnOrder) {
        const col = state.columnsById[colId]
        nextCols[colId] = { ...col, taskIds: col.taskIds.filter((id) => !selectedSet.has(id)) }
      }

      const insertAt = clampIndex(action.toIndex ?? 0, nextCols[to.id].taskIds.length)
      const nextToTaskIds = [
        ...nextCols[to.id].taskIds.slice(0, insertAt),
        ...selected,
        ...nextCols[to.id].taskIds.slice(insertAt),
      ]
      nextCols[to.id] = { ...nextCols[to.id], taskIds: nextToTaskIds }

      return { ...state, columnsById: nextCols, selection: { taskIds: [] } }
    }
    default:
      return state
  }
}

