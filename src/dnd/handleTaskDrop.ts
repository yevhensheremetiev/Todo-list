import type { AppDispatch } from '../store/store'
import { boardActions } from '../store/boardSlice'
import type { BoardState } from '../types/board'
import type { BoardTaskDragData } from '../types/dnd'
import { DND_TASK } from '../types/dnd'

export function handleTaskDropOnGap(
  dispatch: AppDispatch,
  getBoard: () => BoardState,
  sourceData: Record<string, unknown>,
  targetColumnId: string,
  insertAt: number,
) {
  if (sourceData.dnd !== DND_TASK) return
  const d = sourceData as unknown as BoardTaskDragData
  const taskId = d.taskId
  const fromColumnId = d.columnId
  const fromIndex = d.index

  const board = getBoard()
  const selected = board.selection.taskIds
  const selectedSet = new Set(selected)
  const moveGroup = selected.length > 1 && selectedSet.has(taskId)

  if (moveGroup) {
    dispatch(boardActions.bulkMoveSelected({ toColumnId: targetColumnId, toIndex: insertAt }))
    return
  }

  if (fromColumnId === targetColumnId) {
    let dest = insertAt
    if (fromIndex < dest) dest -= 1
    if (fromIndex === dest) return
    dispatch(
      boardActions.taskReorderWithinColumn({
        columnId: fromColumnId,
        fromIndex,
        toIndex: dest,
      }),
    )
    return
  }

  dispatch(
    boardActions.taskMove({
      taskId,
      fromColumnId,
      toColumnId: targetColumnId,
      toIndex: insertAt,
    }),
  )
}
