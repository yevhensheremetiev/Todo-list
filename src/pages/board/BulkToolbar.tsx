import { useRef } from 'react'
import { useAppDispatch, useAppSelector } from '../../state/store/hooks'
import { boardActions } from '../../state/store/boardSlice'
import type { RootState } from '../../state/store/store'

export function BulkToolbar() {
  const dispatch = useAppDispatch()
  const board = useAppSelector((s: RootState) => s.board)
  const selectRef = useRef<HTMLSelectElement>(null)
  const count = board.selection.taskIds.length
  if (count === 0) return null

  const moveTo = (columnId: string) => {
    if (!columnId) return
    dispatch(boardActions.bulkMoveSelected({ toColumnId: columnId, toIndex: 0 }))
    if (selectRef.current) selectRef.current.value = ''
  }

  return (
    <div className="bulkBar" role="region" aria-label="Bulk actions">
      <span className="bulkBar__count">{count} selected</span>
      <button
        type="button"
        className="btn btn--subtle"
        onClick={() => dispatch(boardActions.taskSetComplete({ taskIds: board.selection.taskIds, completed: true }))}
      >
        Complete
      </button>
      <button
        type="button"
        className="btn btn--subtle"
        onClick={() => dispatch(boardActions.taskSetComplete({ taskIds: board.selection.taskIds, completed: false }))}
      >
        Incomplete
      </button>
      <label className="bulkBar__move">
        <span className="visuallyHidden">Move to column</span>
        <select
          ref={selectRef}
          className="bulkBar__select"
          defaultValue=""
          aria-label="Move selected tasks to column"
          onChange={(e) => moveTo(e.target.value)}
        >
          <option value="" disabled>
            Move to…
          </option>
          {board.columnOrder.map((id) => (
            <option key={id} value={id}>
              {board.columnsById[id].title}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="btn btn--danger"
        onClick={() => {
          if (window.confirm(`Delete ${count} task(s)?`)) dispatch(boardActions.bulkDeleteSelected())
        }}
      >
        Delete
      </button>
      <button type="button" className="btn btn--subtle" onClick={() => dispatch(boardActions.selectionClear())}>
        Clear
      </button>
    </div>
  )
}
