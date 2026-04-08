import { useMemo, useReducer } from 'react'
import { Column } from './Column.tsx'
import { boardReducer, createInitialBoardState } from '../../state/boardReducer.ts'
import type { StatusFilter } from '../../types/board.ts'
import '../../styles/board.css'

type Props = {
  searchQuery: string
  statusFilter: StatusFilter
}

export function BoardPage({ searchQuery, statusFilter }: Props) {
  const initial = useMemo(() => createInitialBoardState(), [])
  const [state, dispatch] = useReducer(boardReducer, initial)

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
              onToggleSelect={(taskId) => dispatch({ type: 'selection/toggle', taskId })}
              onSelectAll={() => dispatch({ type: 'selection/selectAllInColumn', columnId })}
              onDeselectAll={() => dispatch({ type: 'selection/deselectAllInColumn', columnId })}
            />
          </div>
        ))}
      </div>
    </section>
  )
}

