import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { useContext, useEffect, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { store } from '../store/store'
import type { ColumnId } from '../types/board'
import type { RootState } from '../store/store'
import { DndDragContext } from './DndDragContext.tsx'
import { handleTaskDropOnGap } from './handleTaskDrop'
import { DND_TASK, DND_TASK_GAP } from '../types/dnd'
import { taskDropWouldChangeState } from './wouldDropChangeState'

type Props = {
  columnId: ColumnId
  insertAt: number
  emptyPlaceholder?: boolean
}

export function TaskDropGap({ columnId, insertAt, emptyPlaceholder }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const dispatch = useAppDispatch()
  const board = useAppSelector((s: RootState) => s.board)
  const { dragSource } = useContext(DndDragContext)
  const [isOver, setIsOver] = useState(false)

  const showHint =
    dragSource && taskDropWouldChangeState(board, dragSource, columnId, insertAt)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    return dropTargetForElements({
      element: el,
      getData: () => ({ dnd: DND_TASK_GAP, columnId, insertAt }),
      canDrop: ({ source }) => {
        if ((source.data as { dnd?: string }).dnd !== DND_TASK) return false
        return taskDropWouldChangeState(store.getState().board, source.data, columnId, insertAt)
      },
      onDragEnter: () => setIsOver(true),
      onDragLeave: () => setIsOver(false),
      onDrop: ({ source }) => {
        setIsOver(false)
        handleTaskDropOnGap(dispatch, () => store.getState().board, source.data, columnId, insertAt)
      },
    })
  }, [columnId, insertAt, dispatch])

  return (
    <div
      ref={ref}
      className={[
        'taskDropGap',
        emptyPlaceholder ? 'taskDropGap--empty taskList__empty' : '',
        showHint ? 'taskDropGap--hint' : '',
        isOver ? 'taskDropGap--active' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden={emptyPlaceholder ? undefined : true}
      aria-label={emptyPlaceholder ? 'Drop tasks here' : undefined}
      role={emptyPlaceholder ? 'listitem' : undefined}
    >
      {emptyPlaceholder ? 'No tasks yet.' : null}
    </div>
  )
}
