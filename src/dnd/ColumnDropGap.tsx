import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { useContext, useEffect, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../state/store/hooks.ts'
import { store } from '../state/store/store.ts'
import type { RootState } from '../state/store/store.ts'
import { DndDragContext } from './DndDragContext.tsx'
import { handleColumnDropOnGap } from './handleColumnDrop'
import { DND_COLUMN, DND_COLUMN_GAP } from '../types/dnd'
import { columnDropWouldChangeState } from './wouldDropChangeState'

type Props = {
  insertAt: number
}

export function ColumnDropGap({ insertAt }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const dispatch = useAppDispatch()
  const board = useAppSelector((s: RootState) => s.board)
  const { dragSource } = useContext(DndDragContext)
  const [isOver, setIsOver] = useState(false)

  const showHint = dragSource && columnDropWouldChangeState(board, dragSource, insertAt)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    return dropTargetForElements({
      element: el,
      getData: () => ({ dnd: DND_COLUMN_GAP, insertAt }),
      canDrop: ({ source }) => {
        if ((source.data as { dnd?: string }).dnd !== DND_COLUMN) return false
        return columnDropWouldChangeState(store.getState().board, source.data, insertAt)
      },
      onDragEnter: () => setIsOver(true),
      onDragLeave: () => setIsOver(false),
      onDrop: ({ source }) => {
        setIsOver(false)
        handleColumnDropOnGap(dispatch, () => store.getState().board, source.data, insertAt)
      },
    })
  }, [insertAt, dispatch])

  return (
    <div
      ref={ref}
      className={[
        'columnDropGap',
        showHint ? 'columnDropGap--hint' : '',
        isOver ? 'columnDropGap--active' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden
    />
  )
}
