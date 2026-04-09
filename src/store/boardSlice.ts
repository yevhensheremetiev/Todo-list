import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { BoardState, Column, ColumnId, Task, TaskId } from '../types/board'
import { createInitialBoardState } from '../board/initialBoard'

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
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

type MoveTaskPayload = {
  taskId: TaskId
  fromColumnId: ColumnId
  toColumnId: ColumnId
  toIndex: number
}

export const boardSlice = createSlice({
  name: 'board',
  initialState: createInitialBoardState() as BoardState,
  reducers: {
    columnAdd(state, action: PayloadAction<{ title?: string } | undefined>) {
      const title = action.payload?.title?.trim() || 'New column'
      const column = createColumn(title)
      state.columnOrder.push(column.id)
      state.columnsById[column.id] = column
    },
    columnDelete(state, action: PayloadAction<{ columnId: ColumnId }>) {
      const col = state.columnsById[action.payload.columnId]
      if (!col) return

      for (const taskId of col.taskIds) {
        delete state.tasksById[taskId]
      }
      state.selection.taskIds = state.selection.taskIds.filter((id) => !col.taskIds.includes(id))

      delete state.columnsById[action.payload.columnId]
      state.columnOrder = state.columnOrder.filter((id) => id !== action.payload.columnId)
    },
    columnRename(state, action: PayloadAction<{ columnId: ColumnId; title: string }>) {
      const col = state.columnsById[action.payload.columnId]
      if (!col) return
      const title = action.payload.title.trim()
      if (!title) return
      col.title = title
    },
    columnReorder(state, action: PayloadAction<{ columnOrder: ColumnId[] }>) {
      state.columnOrder = action.payload.columnOrder
    },

    taskAdd(state, action: PayloadAction<{ columnId: ColumnId; title: string }>) {
      const col = state.columnsById[action.payload.columnId]
      if (!col) return
      const title = action.payload.title.trim()
      if (!title) return
      const task = createTask(title)
      state.tasksById[task.id] = task
      col.taskIds.unshift(task.id)
    },
    taskDelete(state, action: PayloadAction<{ taskId: TaskId }>) {
      if (!state.tasksById[action.payload.taskId]) return
      delete state.tasksById[action.payload.taskId]
      for (const colId of state.columnOrder) {
        const col = state.columnsById[colId]
        col.taskIds = col.taskIds.filter((id) => id !== action.payload.taskId)
      }
      state.selection.taskIds = state.selection.taskIds.filter((id) => id !== action.payload.taskId)
    },
    taskToggleComplete(state, action: PayloadAction<{ taskId: TaskId }>) {
      const task = state.tasksById[action.payload.taskId]
      if (!task) return
      task.completed = !task.completed
      task.updatedAt = Date.now()
    },
    taskSetComplete(state, action: PayloadAction<{ taskIds: TaskId[]; completed: boolean }>) {
      const now = Date.now()
      for (const taskId of action.payload.taskIds) {
        const task = state.tasksById[taskId]
        if (!task) continue
        task.completed = action.payload.completed
        task.updatedAt = now
      }
    },
    taskRename(state, action: PayloadAction<{ taskId: TaskId; title: string }>) {
      const task = state.tasksById[action.payload.taskId]
      if (!task) return
      const title = action.payload.title.trim()
      if (!title) return
      task.title = title
      task.updatedAt = Date.now()
    },
    taskReorderWithinColumn(
      state,
      action: PayloadAction<{ columnId: ColumnId; fromIndex: number; toIndex: number }>,
    ) {
      const col = state.columnsById[action.payload.columnId]
      if (!col) return
      if (col.taskIds.length < 2) return
      col.taskIds = reorder(col.taskIds, action.payload.fromIndex, action.payload.toIndex)
    },
    taskMove(state, action: PayloadAction<MoveTaskPayload>) {
      const from = state.columnsById[action.payload.fromColumnId]
      const to = state.columnsById[action.payload.toColumnId]
      if (!from || !to) return
      if (!from.taskIds.includes(action.payload.taskId)) return
      from.taskIds = from.taskIds.filter((id) => id !== action.payload.taskId)
      to.taskIds = insertIntoArray(to.taskIds, action.payload.toIndex, action.payload.taskId)
    },

    selectionSet(state, action: PayloadAction<{ taskIds: TaskId[] }>) {
      state.selection.taskIds = unique(action.payload.taskIds).filter((id) => !!state.tasksById[id])
    },
    selectionToggle(state, action: PayloadAction<{ taskId: TaskId }>) {
      const id = action.payload.taskId
      if (!state.tasksById[id]) return
      const set = new Set(state.selection.taskIds)
      if (set.has(id)) set.delete(id)
      else set.add(id)
      state.selection.taskIds = Array.from(set)
    },
    selectionClear(state) {
      state.selection.taskIds = []
    },
    selectionSelectAllInColumn(state, action: PayloadAction<{ columnId: ColumnId }>) {
      const col = state.columnsById[action.payload.columnId]
      if (!col) return
      state.selection.taskIds = unique([...state.selection.taskIds, ...col.taskIds])
    },
    selectionDeselectAllInColumn(state, action: PayloadAction<{ columnId: ColumnId }>) {
      const col = state.columnsById[action.payload.columnId]
      if (!col) return
      const set = new Set(state.selection.taskIds)
      for (const id of col.taskIds) set.delete(id)
      state.selection.taskIds = Array.from(set)
    },

    bulkDeleteSelected(state) {
      if (state.selection.taskIds.length === 0) return
      const deleteIds = new Set(state.selection.taskIds)
      for (const id of deleteIds) delete state.tasksById[id]
      for (const colId of state.columnOrder) {
        const col = state.columnsById[colId]
        col.taskIds = col.taskIds.filter((id) => !deleteIds.has(id))
      }
      state.selection.taskIds = []
    },
    bulkMoveSelected(state, action: PayloadAction<{ toColumnId: ColumnId; toIndex?: number }>) {
      const to = state.columnsById[action.payload.toColumnId]
      if (!to) return
      const selected = state.selection.taskIds.filter((id) => !!state.tasksById[id])
      if (selected.length === 0) return

      const selectedSet = new Set(selected)
      for (const colId of state.columnOrder) {
        const col = state.columnsById[colId]
        col.taskIds = col.taskIds.filter((id) => !selectedSet.has(id))
      }

      const insertAt = clampIndex(action.payload.toIndex ?? 0, to.taskIds.length)
      to.taskIds = [...to.taskIds.slice(0, insertAt), ...selected, ...to.taskIds.slice(insertAt)]
      state.selection.taskIds = []
    },
  },
})

export const boardActions = boardSlice.actions
export const boardReducer = boardSlice.reducer

