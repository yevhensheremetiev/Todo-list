import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { useEffect, useRef } from 'react'
import { useAppDispatch } from '../store/hooks'
import { store } from '../store/store'
import type { ColumnId } from '../types/board'
import { handleTaskDropOnGap } from './handleTaskDrop'
import { DND_TASK, DND_TASK_GAP } from '../types/dnd'

type Props = {
  columnId: ColumnId
  insertAt: number
}

export function TaskDropGap({ columnId, insertAt }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const dispatch = useAppDispatch()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    return dropTargetForElements({
      element: el,
      getData: () => ({ dnd: DND_TASK_GAP, columnId, insertAt }),
      canDrop: ({ source }) => (source.data as { dnd?: string }).dnd === DND_TASK,
      onDrop: ({ source }) => {
        handleTaskDropOnGap(dispatch, () => store.getState().board, source.data, columnId, insertAt)
      },
    })
  }, [columnId, insertAt, dispatch])

  return <div ref={ref} className="taskDropGap" />
}
