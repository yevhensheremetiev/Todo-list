import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ColumnId, Task } from '../../types/board.ts'
import { highlightMatchParts } from '../../utils/search.ts'
import { useAppDispatch } from '../../store/hooks'
import { boardActions } from '../../store/boardSlice'
import { DND_TASK } from '../../types/dnd.ts'

type Props = {
  task: Task
  columnId: ColumnId
  index: number
  searchQuery: string
  selected: boolean
  dimmed: boolean
  onToggleSelect: () => void
}

export function TaskItem({
  task,
  columnId,
  index,
  searchQuery,
  selected,
  dimmed,
  onToggleSelect,
}: Props) {
  const dispatch = useAppDispatch()
  const rowRef = useRef<HTMLDivElement>(null)
  const handleRef = useRef<HTMLButtonElement>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const parts = useMemo(
    () => highlightMatchParts(task.title, searchQuery),
    [task.title, searchQuery],
  )

  useEffect(() => {
    const el = rowRef.current
    const handle = handleRef.current
    if (!el || !handle) return
    return draggable({
      element: el,
      dragHandle: handle,
      getInitialData: () => ({
        dnd: DND_TASK,
        taskId: task.id,
        columnId,
        index,
      }),
    })
  }, [task.id, columnId, index])

  const saveEdit = () => {
    const t = draft.trim()
    if (!t) {
      setDraft(task.title)
      setEditing(false)
      return
    }
    if (t !== task.title) dispatch(boardActions.taskRename({ taskId: task.id, title: t }))
    setEditing(false)
  }

  return (
    <div
      ref={rowRef}
      className={[
        'task',
        task.completed ? 'task--completed' : '',
        dimmed ? 'task--dimmed' : '',
        selected ? 'task--selected' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <button
        ref={handleRef}
        type="button"
        className="task__dragHandle"
        aria-label="Drag task"
        title="Drag to reorder or move"
      >
        ⋮⋮
      </button>

      <label className="task__select">
        <input type="checkbox" checked={selected} onChange={onToggleSelect} aria-label="Select task" />
      </label>

      <label className="task__check">
        <input
          className="task__completeBox"
          type="checkbox"
          checked={task.completed}
          onChange={() => dispatch(boardActions.taskToggleComplete({ taskId: task.id }))}
          aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
        />
      </label>

      {editing ? (
        <input
          className="task__editInput"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveEdit()
            if (e.key === 'Escape') {
              setDraft(task.title)
              setEditing(false)
            }
          }}
          autoFocus
          aria-label="Edit task title"
        />
      ) : (
        <button
          type="button"
          className="task__titleBtn"
          title={task.title}
          onDoubleClick={() => {
            setDraft(task.title)
            setEditing(true)
          }}
        >
          {parts.map((p, idx) =>
            p.type === 'match' ? <mark key={idx}>{p.text}</mark> : <span key={idx}>{p.text}</span>,
          )}
        </button>
      )}

      <button
        className="iconBtn"
        type="button"
        aria-label="Delete task"
        title="Delete task"
        onClick={() => dispatch(boardActions.taskDelete({ taskId: task.id }))}
      >
        🗑
      </button>
    </div>
  )
}
