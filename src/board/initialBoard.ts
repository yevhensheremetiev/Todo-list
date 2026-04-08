import type { BoardState, ColumnId, TaskId } from '../types/board'

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
