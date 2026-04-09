import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ColumnId, Task } from '../../types/board.ts'
import { highlightMatchParts } from '../../utils/search.ts'
import { useAppDispatch, useAppSelector } from '../../state/store/hooks.ts'
import { boardActions } from '../../state/store/boardSlice.ts'
import { DND_TASK } from '../../types/dnd.ts'
import { pointerOutsideOfPreview } from '@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview'
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview'
import type { RootState } from '../../state/store/store.ts'
import { DndDragContext } from '../../dnd/DndDragContext.tsx'
import { useContext } from 'react'

type Props = {
  task: Task
  columnId: ColumnId
  index: number
  searchQuery: string
  selected: boolean
  dimmed: boolean
  onToggleSelect: () => void
}

type DragPreviewState =
  | { type: 'idle' }
  | { type: 'preview'; container: HTMLElement; width: number }

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
  const selectedIds = useAppSelector((s: RootState) => s.board.selection.taskIds)
  const selectedCount = selectedIds.length
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const boardTasksById = useAppSelector((s: RootState) => s.board.tasksById)
  const boardColumnOrder = useAppSelector((s: RootState) => s.board.columnOrder)
  const boardColumnsById = useAppSelector((s: RootState) => s.board.columnsById)
  const { dragSource } = useContext(DndDragContext)
  const handleRef = useRef<HTMLButtonElement>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [dragPreview, setDragPreview] = useState<DragPreviewState>({ type: 'idle' })
  const showMultiPreview = selected && selectedCount > 1
  const isDraggingSelectedGroup =
    (dragSource as { dnd?: string; taskId?: string } | null)?.dnd === DND_TASK &&
    selectedCount > 1 &&
    !!(dragSource as { taskId?: string } | null)?.taskId &&
    selectedSet.has((dragSource as { taskId: string }).taskId)
  const orderedSelectedTaskIds = useMemo(() => {
    if (!showMultiPreview) return []
    const out: string[] = []
    for (const colId of boardColumnOrder) {
      const col = boardColumnsById[colId]
      if (!col) continue
      for (const id of col.taskIds) {
        if (selectedSet.has(id)) out.push(id)
      }
    }
    return out
  }, [showMultiPreview, boardColumnOrder, boardColumnsById, selectedSet])

  const parts = useMemo(
    () => highlightMatchParts(task.title, searchQuery),
    [task.title, searchQuery],
  )

  useEffect(() => {
    const handle = handleRef.current
    if (!handle) return
    return draggable({
      element: handle,
      getInitialData: () => ({
        dnd: DND_TASK,
        taskId: task.id,
        columnId,
        index,
      }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => {
        setIsDragging(false)
        setDragPreview({ type: 'idle' })
      },
      onGenerateDragPreview: ({ nativeSetDragImage }) => {
        setCustomNativeDragPreview({
          nativeSetDragImage,
          getOffset: pointerOutsideOfPreview({ x: '8px', y: '8px' }),
          render: ({ container }) => {
            const taskEl = handle.closest('.task') as HTMLElement | null
            const rect = taskEl?.getBoundingClientRect()
            const width = Math.max(240, Math.round(rect?.width ?? 360))
            setDragPreview({ type: 'preview', container, width })
            return () => setDragPreview({ type: 'idle' })
          },
        })
      },
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
    <>
      <div
        className={[
          'task',
          task.completed ? 'task--completed' : '',
          dimmed ? 'task--dimmed' : '',
          selected ? 'task--selected' : '',
          isDragging || (isDraggingSelectedGroup && selected) ? 'task--dragging' : '',
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

      {dragPreview.type === 'preview'
        ? createPortal(
            showMultiPreview ? (
              <div className="taskPreviewList" style={{ width: dragPreview.width }}>
                {orderedSelectedTaskIds.map((id) => {
                  const t = boardTasksById[id]
                  if (!t) return null
                  return (
                    <div
                      key={id}
                      className={['task', 'task--dragPreview', t.completed ? 'task--completed' : ''].filter(Boolean).join(' ')}
                      style={{ width: dragPreview.width }}
                    >
                      <span className="task__dragHandle" aria-hidden="true">
                        ⋮⋮
                      </span>
                      <span className="task__select" aria-hidden="true">
                        <input type="checkbox" checked readOnly tabIndex={-1} />
                      </span>
                      <span className="task__check" aria-hidden="true">
                        <input className="task__completeBox" type="checkbox" checked={t.completed} readOnly tabIndex={-1} />
                      </span>
                      <span className="task__title" aria-hidden="true">
                        {t.title}
                      </span>
                      <span className="iconBtn" aria-hidden="true">
                        🗑
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="taskPreviewStack">
                <div
                  className={[
                    'task',
                    'task--dragPreview',
                    task.completed ? 'task--completed' : '',
                    selected ? 'task--selected' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={{ width: dragPreview.width }}
                >
                  <span className="task__dragHandle" aria-hidden="true">
                    ⋮⋮
                  </span>
                  <span className="task__select" aria-hidden="true">
                    <input type="checkbox" checked={selected} readOnly tabIndex={-1} />
                  </span>
                  <span className="task__check" aria-hidden="true">
                    <input
                      className="task__completeBox"
                      type="checkbox"
                      checked={task.completed}
                      readOnly
                      tabIndex={-1}
                    />
                  </span>
                  <span className="task__title" aria-hidden="true">
                    {parts.map((p, idx) =>
                      p.type === 'match' ? <mark key={idx}>{p.text}</mark> : <span key={idx}>{p.text}</span>,
                    )}
                  </span>
                  <span className="iconBtn" aria-hidden="true">
                    🗑
                  </span>
                </div>
              </div>
            ),
            dragPreview.container,
          )
        : null}
    </>
  )
}
