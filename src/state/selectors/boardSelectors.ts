import { createSelector } from '@reduxjs/toolkit'
import Fuse from 'fuse.js'
import type { RootState } from '../store/store.ts'
import type { ColumnId, StatusFilter, Task } from '../../types/board.ts'
import { taskMatchesStatus } from '../../utils/filterTasks.ts'

export const selectBoard = (s: RootState) => s.board

export const selectColumnOrder = createSelector(selectBoard, (b) => b.columnOrder)

export const selectColumnsById = createSelector(selectBoard, (b) => b.columnsById)

export const selectTasksById = createSelector(selectBoard, (b) => b.tasksById)

export const selectSelectionIds = createSelector(selectBoard, (b) => b.selection.taskIds)

export const selectOrderedSelectionTaskIds = createSelector(
  [selectBoard],
  (board): string[] => {
    const selected = new Set(board.selection.taskIds)
    const out: string[] = []
    for (const colId of board.columnOrder) {
      for (const taskId of board.columnsById[colId].taskIds) {
        if (selected.has(taskId)) out.push(taskId)
      }
    }
    return out
  },
)

export function filterTasksForDisplay(
  tasks: Task[],
  searchQuery: string,
  statusFilter: StatusFilter,
): Task[] {
  const statusFiltered = tasks.filter((t) => taskMatchesStatus(t, statusFilter))

  const q = searchQuery.trim()
  if (!q) return statusFiltered

  const fuse = new Fuse(statusFiltered, {
    keys: ['title'],
    threshold: 0.35,
    ignoreLocation: true,
    minMatchCharLength: 2,
    shouldSort: true,
  })

  return fuse.search(q).map((r) => r.item)
}

export function orderedTaskIdsInColumn(columnId: ColumnId, state: RootState['board']): string[] {
  return state.columnsById[columnId]?.taskIds ?? []
}
