import { useCallback, useContext, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '../state/store/hooks.ts'
import { store } from '../state/store/store.ts'
import type { RootState } from '../state/store/store.ts'
import { DndDragContext } from './DndDragContext.tsx'
import { handleColumnDropOnGap } from './handleColumnDrop'
import { DND_COLUMN, DND_COLUMN_GAP } from '../types/dnd'
import { columnDropWouldChangeState } from './wouldDropChangeState'
import type { DropGapCanDropArgs, DropGapOnDropArgs } from './useDropGap'
import { useDropGap } from './useDropGap'
import { cn } from '../utils/cn.ts'

type Props = {
  insertAt: number
}

export function ColumnDropGap({ insertAt }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const dispatch = useAppDispatch()
  const board = useAppSelector((s: RootState) => s.board)
  const { dragSource } = useContext(DndDragContext)

  const showHint = dragSource && columnDropWouldChangeState(board, dragSource, insertAt)

  const getData = useCallback(() => ({ dnd: DND_COLUMN_GAP, insertAt }), [insertAt])

  const canDrop = useCallback(
    ({ source }: DropGapCanDropArgs) => {
      if ((source.data as { dnd?: string }).dnd !== DND_COLUMN) return false
      return columnDropWouldChangeState(store.getState().board, source.data, insertAt)
    },
    [insertAt],
  )

  const onDrop = useCallback(
    ({ source }: DropGapOnDropArgs) => {
      handleColumnDropOnGap(dispatch, () => store.getState().board, source.data, insertAt)
    },
    [dispatch, insertAt],
  )

  const { isOver } = useDropGap({
    element: ref.current,
    getData,
    canDrop,
    onDrop,
  })

  return (
    <div
      ref={ref}
      className={cn(
        'columnDropGap',
        showHint ? 'columnDropGap--hint' : '',
        isOver ? 'columnDropGap--active' : '',
      )}
      aria-hidden
    />
  )
}
