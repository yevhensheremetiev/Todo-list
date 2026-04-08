import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { useEffect, useRef } from 'react'
import { useAppDispatch } from '../store/hooks'
import { store } from '../store/store'
import { handleColumnDropOnGap } from './handleColumnDrop'
import { DND_COLUMN, DND_COLUMN_GAP } from '../types/dnd'

type Props = {
  insertAt: number
}

export function ColumnDropGap({ insertAt }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const dispatch = useAppDispatch()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    return dropTargetForElements({
      element: el,
      getData: () => ({ dnd: DND_COLUMN_GAP, insertAt }),
      canDrop: ({ source }) => (source.data as { dnd?: string }).dnd === DND_COLUMN,
      onDrop: ({ source }) => {
        handleColumnDropOnGap(dispatch, () => store.getState().board, source.data, insertAt)
      },
    })
  }, [insertAt, dispatch])

  return <div ref={ref} className="columnDropGap" aria-hidden />
}
