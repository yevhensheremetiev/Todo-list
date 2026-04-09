import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { Fragment, useEffect, useId, useRef, useState } from 'react'
import type { ColumnId, StatusFilter, Task } from '../../types/board.ts'
import { TaskItem } from './TaskItem.tsx'
import { TaskDropGap } from '../../dnd/TaskDropGap.tsx'
import { useAppDispatch } from '../../store/hooks'
import { boardActions } from '../../store/boardSlice'
import { filterTasksForDisplay } from '../../selectors/boardSelectors.ts'
import { DND_COLUMN } from '../../types/dnd.ts'

type Props = {
  column: { id: ColumnId; title: string; taskIds: string[] }
  tasksById: Record<string, Task>
  columnIndex: number
  searchQuery: string
  statusFilter: StatusFilter
  selection: string[]
  onToggleSelect: (taskId: string) => void
  onSelectAll: () => void
  onDeselectAll: () => void
}

export function Column({
  column,
  tasksById,
  columnIndex,
  searchQuery,
  statusFilter,
  selection,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
}: Props) {
  const dispatch = useAppDispatch()
  const headingId = useId()
  const handleRef = useRef<HTMLButtonElement>(null)
  const [newTitle, setNewTitle] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')

  const fullTasks = column.taskIds.map((id) => tasksById[id]).filter(Boolean)
  const visibleTasks = filterTasksForDisplay(fullTasks, searchQuery, statusFilter)
  const visibleSet = new Set(visibleTasks.map((t) => t.id))

  useEffect(() => {
    const handle = handleRef.current
    if (!handle) return
    return draggable({
      element: handle,
      getInitialData: () => ({
        dnd: DND_COLUMN,
        columnId: column.id,
        index: columnIndex,
      }),
    })
  }, [column.id, columnIndex])

  const selectedInColumn = selection.filter((id) => column.taskIds.includes(id))
  const allSelected = fullTasks.length > 0 && selectedInColumn.length === fullTasks.length

  const deleteColumn = () => {
    if (!window.confirm('Delete this column and all its tasks?')) return
    dispatch(boardActions.columnDelete({ columnId: column.id }))
  }

  const addTask = () => {
    const t = newTitle.trim()
    if (!t) return
    dispatch(boardActions.taskAdd({ columnId: column.id, title: t }))
    setNewTitle('')
  }

  return (
    <div className="column" aria-labelledby={headingId}>
      <header className="column__header">
        <button
          ref={handleRef}
          type="button"
          className="column__dragHandle"
          aria-label="Drag column"
          title="Drag column"
        >
          ⋮⋮
        </button>
        <div className="column__headerText">
          {renaming ? (
            <input
              className="column__titleInput"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onBlur={() => {
                const t = draftTitle.trim()
                if (t && t !== column.title) dispatch(boardActions.columnRename({ columnId: column.id, title: t }))
                else setDraftTitle(column.title)
                setRenaming(false)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                if (e.key === 'Escape') {
                  setDraftTitle(column.title)
                  setRenaming(false)
                }
              }}
              autoFocus
              aria-label="Rename column"
            />
          ) : (
            <div id={headingId} className="column__title" role="heading" aria-level={2}>
              <button
                type="button"
                className="column__titleBtn"
                onDoubleClick={() => {
                  setDraftTitle(column.title)
                  setRenaming(true)
                }}
              >
                {column.title}
              </button>
            </div>
          )}
          <div className="column__meta">
            {visibleTasks.length} shown · {fullTasks.length} total
          </div>
        </div>
        <button
          className="btn btn--subtle"
          type="button"
          onClick={() => {
            setDraftTitle(column.title)
            setRenaming(true)
          }}
        >
          Rename
        </button>
      </header>

      <div className="column__addRow">
        <input
          className="column__newTaskInput"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addTask()
          }}
          placeholder="New task…"
          aria-label="New task title"
        />
        <button className="btn btn--subtle" type="button" onClick={addTask}>
          Add
        </button>
      </div>

      <div className="taskList" role="list">
        {fullTasks.length === 0 ? (
          <TaskDropGap key="task-list-empty" columnId={column.id} insertAt={0} emptyPlaceholder />
        ) : (
          <>
            <TaskDropGap key="task-gap-0" columnId={column.id} insertAt={0} />
            {fullTasks.map((task, index) => (
              <Fragment key={task.id}>
                <div role="listitem">
                  <TaskItem
                    task={task}
                    columnId={column.id}
                    index={index}
                    searchQuery={searchQuery}
                    selected={selection.includes(task.id)}
                    dimmed={!visibleSet.has(task.id)}
                    onToggleSelect={() => onToggleSelect(task.id)}
                  />
                </div>
                <TaskDropGap columnId={column.id} insertAt={index + 1} />
              </Fragment>
            ))}
          </>
        )}
      </div>

      <footer className="column__footer">
        {allSelected ? (
          <button className="btn btn--subtle" type="button" onClick={onDeselectAll}>
            Deselect all
          </button>
        ) : (
          <button className="btn btn--subtle" type="button" onClick={onSelectAll} disabled={fullTasks.length === 0}>
            Select all
          </button>
        )}
        <button className="btn btn--danger" type="button" onClick={deleteColumn}>
          Delete column
        </button>
      </footer>
    </div>
  )
}
