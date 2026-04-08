import { Fragment } from 'react'
import { Column } from './Column.tsx'
import type { StatusFilter } from '../../types/board.ts'
import '../../styles/board.css'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { boardActions } from '../../store/boardSlice'
import type { RootState } from '../../store/store'
import { ColumnDropGap } from '../../dnd/ColumnDropGap.tsx'
import { BulkToolbar } from './BulkToolbar.tsx'

type Props = {
  searchQuery: string
  statusFilter: StatusFilter
}

export function BoardPage({ searchQuery, statusFilter }: Props) {
  const state = useAppSelector((s: RootState) => s.board)
  const dispatch = useAppDispatch()

  return (
    <section className="board" aria-label="Todo board">
      <BulkToolbar />
      <div className="board__toolbar">
        <button type="button" className="btn btn--subtle" onClick={() => dispatch(boardActions.columnAdd({}))}>
          + Column
        </button>
      </div>
      <div className="board__columns" role="list">
        <ColumnDropGap insertAt={0} />
        {state.columnOrder.map((columnId, columnIndex) => (
          <Fragment key={columnId}>
            <div role="listitem" className="board__columnWrap">
              <Column
                column={state.columnsById[columnId]}
                tasksById={state.tasksById}
                columnIndex={columnIndex}
                searchQuery={searchQuery}
                statusFilter={statusFilter}
                selection={state.selection.taskIds}
                onToggleSelect={(taskId) => dispatch(boardActions.selectionToggle({ taskId }))}
                onSelectAll={() => dispatch(boardActions.selectionSelectAllInColumn({ columnId }))}
                onDeselectAll={() => dispatch(boardActions.selectionDeselectAllInColumn({ columnId }))}
              />
            </div>
            <ColumnDropGap insertAt={columnIndex + 1} />
          </Fragment>
        ))}
      </div>
    </section>
  )
}
