import type { BoardState, Column, ColumnId } from '../types/board'
import type { BoardColumnDragData, BoardTaskDragData } from '../types/dnd'
import { DND_COLUMN, DND_TASK } from '../types/dnd'

function clampIndex(index: number, length: number) {
  return Math.max(0, Math.min(index, Math.max(0, length)))
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

function cloneBoard(board: BoardState): BoardState {
  const columnsById: Record<ColumnId, Column> = {}
  for (const id of board.columnOrder) {
    const c = board.columnsById[id]
    columnsById[id] = { ...c, taskIds: [...c.taskIds] }
  }
  return {
    columnOrder: [...board.columnOrder],
    columnsById,
    tasksById: { ...board.tasksById },
    selection: { taskIds: [...board.selection.taskIds] },
  }
}

function columnTaskIdsSignature(board: BoardState): string {
  return board.columnOrder
    .map((id) => `${id}:${board.columnsById[id].taskIds.join('\0')}`)
    .join('|')
}

function simulateTaskDrop(
  board: BoardState,
  d: BoardTaskDragData,
  targetColumnId: ColumnId,
  insertAt: number,
): BoardState {
  const b = cloneBoard(board)
  const selectedSet = new Set(b.selection.taskIds.filter((id) => b.tasksById[id]))
  const moveGroup = selectedSet.size > 1 && selectedSet.has(d.taskId)

  if (moveGroup) {
    const selected: string[] = []
    for (const colId of b.columnOrder) {
      const col = b.columnsById[colId]
      for (const id of col.taskIds) {
        if (selectedSet.has(id)) selected.push(id)
      }
    }

    for (const colId of b.columnOrder) {
      b.columnsById[colId].taskIds = b.columnsById[colId].taskIds.filter((id) => !selectedSet.has(id))
    }
    const to = b.columnsById[targetColumnId]
    const insertAtClamped = clampIndex(insertAt, to.taskIds.length)
    to.taskIds = [...to.taskIds.slice(0, insertAtClamped), ...selected, ...to.taskIds.slice(insertAtClamped)]
    return b
  }

  const { taskId, columnId: fromColumnId, index: fromIndex } = d

  if (fromColumnId === targetColumnId) {
    let dest = insertAt
    if (fromIndex < dest) dest -= 1
    if (fromIndex === dest) return b
    const col = b.columnsById[fromColumnId]
    col.taskIds = reorder(col.taskIds, fromIndex, dest)
    return b
  }

  const from = b.columnsById[fromColumnId]
  const to = b.columnsById[targetColumnId]
  if (!from.taskIds.includes(taskId)) return b
  from.taskIds = from.taskIds.filter((id) => id !== taskId)
  to.taskIds = insertIntoArray(to.taskIds, insertAt, taskId)
  return b
}

export function taskDropWouldChangeState(
  board: BoardState,
  sourceData: Record<string, unknown>,
  targetColumnId: ColumnId,
  insertAt: number,
): boolean {
  if ((sourceData as { dnd?: string }).dnd !== DND_TASK) return false
  const d = sourceData as unknown as BoardTaskDragData
  const before = columnTaskIdsSignature(board)
  const after = columnTaskIdsSignature(simulateTaskDrop(board, d, targetColumnId, insertAt))
  return before !== after
}

function simulateColumnDrop(board: BoardState, fromIndex: number, insertAt: number): BoardState {
  const b = cloneBoard(board)
  const order = [...b.columnOrder]
  const [moved] = order.splice(fromIndex, 1)
  let dest = insertAt
  if (fromIndex < insertAt) dest -= 1
  order.splice(dest, 0, moved)
  b.columnOrder = order
  return b
}

export function columnDropWouldChangeState(
  board: BoardState,
  sourceData: Record<string, unknown>,
  insertAt: number,
): boolean {
  if ((sourceData as { dnd?: string }).dnd !== DND_COLUMN) return false
  const { index: fromIndex } = sourceData as unknown as BoardColumnDragData
  const before = board.columnOrder.join(',')
  const after = simulateColumnDrop(board, fromIndex, insertAt).columnOrder.join(',')
  return before !== after
}
