export type StatusFilter = 'all' | 'completed' | 'incomplete'

export type TaskId = string
export type ColumnId = string

export type Task = {
  id: TaskId
  title: string
  completed: boolean
  createdAt: number
  updatedAt: number
}

export type Column = {
  id: ColumnId
  title: string
  taskIds: TaskId[]
}

export type BoardState = {
  columnOrder: ColumnId[]
  columnsById: Record<ColumnId, Column>
  tasksById: Record<TaskId, Task>
  selection: {
    taskIds: TaskId[]
  }
}

