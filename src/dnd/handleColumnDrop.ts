import type { AppDispatch } from '../store/store'
import { boardActions } from '../store/boardSlice'
import type { BoardState } from '../types/board'
import type { BoardColumnDragData } from '../types/dnd'
import { DND_COLUMN } from '../types/dnd'

export function handleColumnDropOnGap(
  dispatch: AppDispatch,
  getBoard: () => BoardState,
  sourceData: Record<string, unknown>,
  insertAt: number,
) {
  if (sourceData.dnd !== DND_COLUMN) return
  const d = sourceData as unknown as BoardColumnDragData
  const fromIndex = d.index
  const order = [...getBoard().columnOrder]
  if (fromIndex < 0 || fromIndex >= order.length) return

  const [moved] = order.splice(fromIndex, 1)
  let dest = insertAt
  if (fromIndex < insertAt) dest -= 1
  order.splice(dest, 0, moved)
  dispatch(boardActions.columnReorder({ columnOrder: order }))
}
