import { useMemo } from 'react'
import type { Task } from '../../types/board.ts'
import { highlightMatchParts } from '../../utils/search.ts'

type Props = {
  task: Task
  searchQuery: string
  selected: boolean
  onToggleSelect: () => void
}

export function TaskItem({ task, searchQuery, selected, onToggleSelect }: Props) {
  const parts = useMemo(
    () => highlightMatchParts(task.title, searchQuery),
    [task.title, searchQuery],
  )

  return (
    <div className={task.completed ? 'task task--completed' : 'task'}>
      <label className="task__select">
        <input type="checkbox" checked={selected} onChange={onToggleSelect} aria-label="Select task" />
      </label>

      <label className="task__check">
        <input type="checkbox" checked={task.completed} readOnly />
        <span className="task__checkUi" aria-hidden="true" />
      </label>

      <div className="task__title" title={task.title}>
        {parts.map((p, idx) =>
          p.type === 'match' ? <mark key={idx}>{p.text}</mark> : <span key={idx}>{p.text}</span>,
        )}
      </div>

      <button className="iconBtn" type="button" aria-label="Delete task" title="Delete task" disabled>
        🗑
      </button>
    </div>
  )
}

