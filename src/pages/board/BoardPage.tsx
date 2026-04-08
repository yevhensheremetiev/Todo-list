import { Column } from './Column.tsx'
import type { StatusFilter } from '../../types/board.ts'
import '../../styles/board.css'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { boardActions } from '../../store/boardSlice'
import type { RootState } from '../../store/store'

type Props = {
  searchQuery: string
  statusFilter: StatusFilter
}

export function BoardPage({ searchQuery, statusFilter }: Props) {
  const state = useAppSelector((s: RootState) => s.board)
  const dispatch = useAppDispatch()

  return (
    <section className="board" aria-label="Todo board">
      <div className="board__columns" role="list">
        {state.columnOrder.map((columnId) => (
          <div key={columnId} role="listitem" className="board__columnWrap">
            <Column
              column={state.columnsById[columnId]}
              tasks={state.columnsById[columnId].taskIds.map((id) => state.tasksById[id])}
              searchQuery={searchQuery}
              statusFilter={statusFilter}
              selection={state.selection.taskIds}
              onToggleSelect={(taskId) => dispatch(boardActions.selectionToggle({ taskId }))}
              onSelectAll={() => dispatch(boardActions.selectionSelectAllInColumn({ columnId }))}
              onDeselectAll={() => dispatch(boardActions.selectionDeselectAllInColumn({ columnId }))}
            />
          </div>
        ))}
      </div>
    </section>
  )
}

