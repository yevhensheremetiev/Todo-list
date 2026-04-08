import type { ColumnId, TaskId } from '../types/board'

export type BoardAction =
  | { type: 'column/add'; title?: string }
  | { type: 'column/delete'; columnId: ColumnId }
  | { type: 'column/rename'; columnId: ColumnId; title: string }
  | { type: 'column/reorder'; columnOrder: ColumnId[] }
  | { type: 'task/add'; columnId: ColumnId; title: string }
  | { type: 'task/delete'; taskId: TaskId }
  | { type: 'task/toggleComplete'; taskId: TaskId }
  | { type: 'task/setComplete'; taskIds: TaskId[]; completed: boolean }
  | { type: 'task/rename'; taskId: TaskId; title: string }
  | { type: 'task/move'; taskId: TaskId; fromColumnId: ColumnId; toColumnId: ColumnId; toIndex: number }
  | {
      type: 'task/reorderWithinColumn'
      columnId: ColumnId
      fromIndex: number
      toIndex: number
    }
  | { type: 'selection/set'; taskIds: TaskId[] }
  | { type: 'selection/toggle'; taskId: TaskId }
  | { type: 'selection/clear' }
  | { type: 'selection/selectAllInColumn'; columnId: ColumnId }
  | { type: 'selection/deselectAllInColumn'; columnId: ColumnId }
  | { type: 'bulk/deleteSelected' }
  | { type: 'bulk/moveSelected'; toColumnId: ColumnId; toIndex?: number }

