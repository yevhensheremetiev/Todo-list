import { useId } from 'react'
import type { StatusFilter, Task } from '../../types/board.ts'
import { TaskItem } from './TaskItem.tsx'

type Props = {
  column: { id: string; title: string }
  tasks: Task[]
  searchQuery: string
  statusFilter: StatusFilter
  selection: string[]
  onToggleSelect: (taskId: string) => void
  onSelectAll: () => void
  onDeselectAll: () => void
}

export function Column({
  column,
  tasks,
  searchQuery,
  statusFilter,
  selection,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
}: Props) {
  const headingId = useId()

  const visibleTasks = tasks.filter((t) => {
    if (statusFilter === 'completed' && !t.completed) return false
    if (statusFilter === 'incomplete' && t.completed) return false
    if (searchQuery.trim()) {
      return t.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
    }
    return true
  })

  return (
    <div className="column" aria-labelledby={headingId}>
      <header className="column__header">
        <div className="column__headerText">
          <h2 id={headingId} className="column__title">
            {column.title}
          </h2>
          <div className="column__meta">{visibleTasks.length} shown</div>
        </div>
        <button className="btn btn--subtle" type="button" disabled>
          + Task
        </button>
      </header>

      <div className="taskList" role="list">
        {visibleTasks.length === 0 ? (
          <div className="taskList__empty">No tasks match.</div>
        ) : (
          visibleTasks.map((task) => (
            <div key={task.id} role="listitem">
              <TaskItem
                task={task}
                searchQuery={searchQuery}
                selected={selection.includes(task.id)}
                onToggleSelect={() => onToggleSelect(task.id)}
              />
            </div>
          ))
        )}
      </div>

      <footer className="column__footer">
        {tasks.length > 0 && selection.filter((id) => tasks.some((t) => t.id === id)).length === tasks.length ? (
          <button className="btn btn--subtle" type="button" onClick={onDeselectAll}>
            Deselect all
          </button>
        ) : (
          <button className="btn btn--subtle" type="button" onClick={onSelectAll} disabled={tasks.length === 0}>
            Select all
          </button>
        )}
        <button className="btn btn--danger" type="button" disabled>
          Delete column
        </button>
      </footer>
    </div>
  )
}

