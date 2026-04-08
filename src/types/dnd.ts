import type { ColumnId, TaskId } from './board'

export const DND_TASK = 'board-task' as const
export const DND_TASK_GAP = 'task-gap' as const
export const DND_COLUMN = 'board-column' as const
export const DND_COLUMN_GAP = 'column-gap' as const

export type BoardTaskDragData = {
  dnd: typeof DND_TASK
  taskId: TaskId
  columnId: ColumnId
  index: number
}

export type BoardColumnDragData = {
  dnd: typeof DND_COLUMN
  columnId: ColumnId
  index: number
}

export type TaskGapDropData = {
  dnd: typeof DND_TASK_GAP
  columnId: ColumnId
  insertAt: number
}

export type ColumnGapDropData = {
  dnd: typeof DND_COLUMN_GAP
  insertAt: number
}
