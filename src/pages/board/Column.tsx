import {
  Fragment,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ColumnId, StatusFilter, Task } from "../../types/board.ts";
import { TaskItem } from "./TaskItem.tsx";
import { TaskDropGap } from "../../dnd/TaskDropGap.tsx";
import { useAppDispatch } from "../../state/store/hooks.ts";
import { boardActions } from "../../state/store/boardSlice.ts";
import { DND_TASK } from "../../types/dnd.ts";
import { ConfirmModal } from "../../components/ConfirmModal.tsx";
import { DndDragContext } from "../../dnd/DndDragContext.tsx";
import { canonicalInsertAt } from "../../utils/canonicalInsertAt.ts";
import { useColumnDraggable } from "./useColumnDraggable.tsx";
import { taskMatchesStatus } from "../../utils/filterTasks.ts";
import { fuseSearchTasksByTitle } from "../../utils/fuseTaskSearch.ts";
import { cn } from "../../utils/cn.ts";

type Props = {
  column: { id: ColumnId; title: string; taskIds: string[] };
  tasksById: Record<string, Task>;
  columnIndex: number;
  searchQuery: string;
  statusFilter: StatusFilter;
  selection: string[];
  orderedSelectionTaskIds: readonly string[];
  onToggleSelect: (taskId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
};

export function Column({
  column,
  tasksById,
  columnIndex,
  searchQuery,
  statusFilter,
  selection,
  orderedSelectionTaskIds,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
}: Props) {
  const dispatch = useAppDispatch();
  const { dragSource } = useContext(DndDragContext);
  const headingId = useId();
  const handleRef = useRef<HTMLButtonElement>(null);
  const [newTitle, setNewTitle] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const canAddTask = newTitle.trim().length > 0;
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const taskIndexById = useMemo(() => {
    const m = new Map<string, number>();
    for (let i = 0; i < column.taskIds.length; i++) m.set(column.taskIds[i], i);
    return m;
  }, [column.taskIds]);

  const fullTasks = column.taskIds.map((id) => tasksById[id]).filter(Boolean);
  const { visibleTasks, matchIndicesByTaskId, visibleSet } = useMemo(() => {
    const statusFiltered = fullTasks.filter((t) =>
      taskMatchesStatus(t, statusFilter),
    );
    const { items, matchIndicesById } = fuseSearchTasksByTitle(
      statusFiltered,
      searchQuery,
      { includeMatches: true, shouldSort: true },
    );
    return {
      visibleTasks: items,
      matchIndicesByTaskId: matchIndicesById,
      visibleSet: new Set(items.map((t) => t.id)),
    };
  }, [fullTasks, searchQuery, statusFilter]);

  const { isDragging, previewPortal } = useColumnDraggable({
    handleRef,
    columnId: column.id,
    columnIndex,
    title: column.title,
    fullTasks,
    visibleTaskIds: visibleTasks.map((t) => t.id),
    selectedTaskIds: selection,
    shownCount: visibleTasks.length,
  });

  const visibleTaskCanonicalInsertAt = (gapIndexInVisibleList: number) =>
    canonicalInsertAt({
      fullIds: column.taskIds,
      visibleIds: visibleTasks.map((t) => t.id),
      gapIndexInVisibleList,
      fullIndexById: taskIndexById,
    });

  const selectedInColumn = selection.filter((id) => visibleSet.has(id));
  const allSelected =
    visibleTasks.length > 0 && selectedInColumn.length === visibleTasks.length;
  const selectedCount = selection.length;
  const selectedSet = useMemo(() => new Set(selection), [selection]);

  const draggedTaskId =
    (dragSource as { dnd?: string; taskId?: string } | null)?.dnd === DND_TASK
      ? (dragSource as { taskId?: string } | null)?.taskId
      : undefined;
  const groupDragActive =
    selectedCount > 1 && !!draggedTaskId && selectedSet.has(draggedTaskId);

  const commitRename = () => {
    const t = draftTitle.trim();
    if (t && t !== column.title)
      dispatch(boardActions.columnRename({ columnId: column.id, title: t }));
    else setDraftTitle(column.title);
  };

  const deleteColumn = () => {
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = () => {
    dispatch(boardActions.columnDelete({ columnId: column.id }));
  };

  const addTask = () => {
    const t = newTitle.trim();
    if (!t) return;
    dispatch(boardActions.taskAdd({ columnId: column.id, title: t }));
    setNewTitle("");
  };

  return (
    <>
      <div
        className={cn("column", { "column--dragging": isDragging })}
        aria-labelledby={headingId}
      >
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
                  commitRename();
                  setRenaming(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitRename();
                    setRenaming(false);
                  }
                  if (e.key === "Escape") {
                    setDraftTitle(column.title);
                    setRenaming(false);
                  }
                }}
                autoFocus
                aria-label="Rename column"
              />
            ) : (
              <div
                id={headingId}
                className="column__title"
                role="heading"
                aria-level={2}
              >
                <button
                  type="button"
                  className="column__titleBtn"
                  onDoubleClick={() => {
                    setDraftTitle(column.title);
                    setRenaming(true);
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
            onMouseDown={(e) => {
              if (renaming) e.preventDefault();
            }}
            onClick={() => {
              if (renaming) {
                commitRename();
                setRenaming(false);
                return;
              }
              setDraftTitle(column.title);
              setRenaming(true);
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
              if (e.key === "Enter") addTask();
            }}
            placeholder="New task…"
            aria-label="New task title"
          />
          <button
            className="btn btn--subtle"
            type="button"
            onClick={addTask}
            disabled={!canAddTask}
            aria-disabled={!canAddTask}
          >
            Add
          </button>
        </div>

        <div className="taskList" role="list">
          {visibleTasks.length === 0 ? (
            <TaskDropGap
              key="task-list-empty"
              columnId={column.id}
              insertAt={0}
              emptyPlaceholder
            />
          ) : (
            <>
              <TaskDropGap
                key="task-gap-0"
                columnId={column.id}
                insertAt={visibleTaskCanonicalInsertAt(0)}
              />
              {visibleTasks.map((task, index) => (
                <Fragment key={task.id}>
                  <div role="listitem">
                    <TaskItem
                      task={task}
                      columnId={column.id}
                      index={taskIndexById.get(task.id) ?? 0}
                      searchQuery={searchQuery}
                      matchIndices={matchIndicesByTaskId.get(task.id)}
                      selected={selection.includes(task.id)}
                      dimmed={false}
                      selectedCount={selectedCount}
                      groupDragActive={groupDragActive}
                      orderedSelectionTaskIds={
                        selection.includes(task.id)
                          ? orderedSelectionTaskIds
                          : undefined
                      }
                      tasksByIdForPreview={
                        selection.includes(task.id) ? tasksById : undefined
                      }
                      onToggleSelect={onToggleSelect}
                    />
                  </div>
                  <TaskDropGap
                    columnId={column.id}
                    insertAt={visibleTaskCanonicalInsertAt(index + 1)}
                  />
                </Fragment>
              ))}
            </>
          )}
        </div>

        <footer className="column__footer">
          {allSelected ? (
            <button
              className="btn btn--subtle"
              type="button"
              onClick={onDeselectAll}
            >
              Deselect all
            </button>
          ) : (
            <button
              className="btn btn--subtle"
              type="button"
              onClick={onSelectAll}
              disabled={visibleTasks.length === 0}
            >
              Select all
            </button>
          )}
          <button
            className="btn btn--danger"
            type="button"
            onClick={deleteColumn}
          >
            Delete column
          </button>
        </footer>
      </div>

      <ConfirmModal
        open={confirmDeleteOpen}
        title="Delete column?"
        description="This will delete the column and all its tasks. This action can’t be undone."
        confirmText="Delete"
        cancelText="Cancel"
        danger
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={() => {
          setConfirmDeleteOpen(false);
          confirmDelete();
        }}
      />

      {previewPortal}
    </>
  );
}
