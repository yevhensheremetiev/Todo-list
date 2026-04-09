import { useCallback, useContext, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '../state/store/hooks.ts'
import { store } from '../state/store/store.ts'
import type { ColumnId } from '../types/board'
import type { RootState } from '../state/store/store.ts'
import { DndDragContext } from './DndDragContext.tsx'
import { handleTaskDropOnGap } from './handleTaskDrop'
import { DND_TASK, DND_TASK_GAP } from '../types/dnd'
import { taskDropWouldChangeState } from './wouldDropChangeState'
import type { DropGapCanDropArgs, DropGapOnDropArgs } from './useDropGap'
import { useDropGap } from './useDropGap'
import { cn } from '../utils/cn.ts'

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

  const showHint =
    dragSource && taskDropWouldChangeState(board, dragSource, columnId, insertAt)

  const getData = useCallback(() => ({ dnd: DND_TASK_GAP, columnId, insertAt }), [
    columnId,
    insertAt,
  ])

  const canDrop = useCallback(
    ({ source }: DropGapCanDropArgs) => {
      if ((source.data as { dnd?: string }).dnd !== DND_TASK) return false
      return taskDropWouldChangeState(store.getState().board, source.data, columnId, insertAt)
    },
    [columnId, insertAt],
  )

  const onDrop = useCallback(
    ({ source }: DropGapOnDropArgs) => {
      handleTaskDropOnGap(dispatch, () => store.getState().board, source.data, columnId, insertAt)
    },
    [columnId, insertAt, dispatch],
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
        'taskDropGap',
        emptyPlaceholder ? 'taskDropGap--empty taskList__empty' : '',
        showHint ? 'taskDropGap--hint' : '',
        isOver ? 'taskDropGap--active' : '',
      )}
      aria-hidden={emptyPlaceholder ? undefined : true}
      aria-label={emptyPlaceholder ? 'Drop tasks here' : undefined}
      role={emptyPlaceholder ? 'listitem' : undefined}
    >
      {emptyPlaceholder ? 'No tasks yet.' : null}
    </div>
  )
}
