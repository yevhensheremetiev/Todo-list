import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { Fragment, useEffect, useId, useRef, useState } from "react";
import type { ColumnId, StatusFilter, Task } from "../../types/board.ts";
import { TaskItem } from "./TaskItem.tsx";
import { TaskDropGap } from "../../dnd/TaskDropGap.tsx";
import { useAppDispatch } from "../../state/store/hooks.ts";
import { boardActions } from "../../state/store/boardSlice.ts";
import { filterTasksForDisplay } from "../../state/selectors/boardSelectors.ts";
import { DND_COLUMN } from "../../types/dnd.ts";
import { pointerOutsideOfPreview } from "@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { createPortal } from "react-dom";
import { ConfirmModal } from "../../components/ConfirmModal.tsx";
import Fuse from "fuse.js";
import type { MatchIndexRange } from "../../utils/search.ts";

type Props = {
  column: { id: ColumnId; title: string; taskIds: string[] };
  tasksById: Record<string, Task>;
  columnIndex: number;
  searchQuery: string;
  statusFilter: StatusFilter;
  selection: string[];
  onToggleSelect: (taskId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
};

type DragPreviewState =
  | { type: "idle" }
  | { type: "preview"; container: HTMLElement; width: number; height: number };

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
  const dispatch = useAppDispatch();
  const headingId = useId();
  const handleRef = useRef<HTMLButtonElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPreview, setDragPreview] = useState<DragPreviewState>({
    type: "idle",
  });
  const [newTitle, setNewTitle] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const canAddTask = newTitle.trim().length > 0;
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const fullTasks = column.taskIds.map((id) => tasksById[id]).filter(Boolean);
  const visibleTasks = filterTasksForDisplay(
    fullTasks,
    searchQuery,
    statusFilter,
  );
  const visibleSet = new Set(visibleTasks.map((t) => t.id));
  const q = searchQuery.trim();
  const matchIndicesByTaskId = new Map<string, readonly MatchIndexRange[]>();
  if (q) {
    const fuse = new Fuse(visibleTasks, {
      keys: ["title"],
      threshold: 0.35,
      ignoreLocation: true,
      minMatchCharLength: 2,
      includeMatches: true,
      shouldSort: false,
    });
    const results = fuse.search(q);
    for (const r of results) {
      const titleMatch = r.matches?.find((m) => m.key === "title");
      const indices = (titleMatch?.indices ??
        []) as unknown as MatchIndexRange[];
      matchIndicesByTaskId.set(r.item.id, indices);
    }
  }

  useEffect(() => {
    const handle = handleRef.current;
    if (!handle) return;
    return draggable({
      element: handle,
      getInitialData: () => ({
        dnd: DND_COLUMN,
        columnId: column.id,
        index: columnIndex,
      }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => {
        setIsDragging(false);
        setDragPreview({ type: "idle" });
      },
      onGenerateDragPreview: ({ nativeSetDragImage }) => {
        setCustomNativeDragPreview({
          nativeSetDragImage,
          getOffset: pointerOutsideOfPreview({ x: "8px", y: "8px" }),
          render: ({ container }) => {
            const columnEl = handle.closest(".column") as HTMLElement | null;
            const rect = columnEl?.getBoundingClientRect();
            const width = Math.max(280, Math.round(rect?.width ?? 320));
            const height = Math.max(160, Math.round(rect?.height ?? 420));
            setDragPreview({ type: "preview", container, width, height });
            return () => setDragPreview({ type: "idle" });
          },
        });
      },
    });
  }, [column.id, columnIndex]);

  const visibleTaskCanonicalInsertAt = (gapIndexInVisibleList: number) => {
    const ids = visibleTasks.map((t) => t.id);
    if (ids.length === 0) return 0;
    const clamped = Math.max(0, Math.min(gapIndexInVisibleList, ids.length));

    if (clamped === 0) return column.taskIds.indexOf(ids[0]);
    if (clamped === ids.length)
      return column.taskIds.indexOf(ids[ids.length - 1]) + 1;

    const nextId = ids[clamped];
    return column.taskIds.indexOf(nextId);
  };

  const selectedInColumn = selection.filter((id) => visibleSet.has(id));
  const allSelected =
    visibleTasks.length > 0 && selectedInColumn.length === visibleTasks.length;

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
        className={["column", isDragging ? "column--dragging" : ""]
          .filter(Boolean)
          .join(" ")}
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
                      index={column.taskIds.indexOf(task.id)}
                      searchQuery={searchQuery}
                      matchIndices={matchIndicesByTaskId.get(task.id)}
                      selected={selection.includes(task.id)}
                      dimmed={false}
                      onToggleSelect={() => onToggleSelect(task.id)}
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

      {dragPreview.type === "preview"
        ? createPortal(
            <div
              className="column column--dragPreview"
              style={{ width: dragPreview.width, height: dragPreview.height }}
            >
              <header className="column__header">
                <span className="column__dragHandle" aria-hidden="true">
                  ⋮⋮
                </span>
                <div className="column__headerText">
                  <div className="column__title" aria-hidden="true">
                    {column.title}
                  </div>
                  <div className="column__meta" aria-hidden="true">
                    {visibleTasks.length} shown · {fullTasks.length} total
                  </div>
                </div>
                <span className="btn btn--subtle" aria-hidden="true">
                  Rename
                </span>
              </header>

              <div className="column__addRow" aria-hidden="true">
                <input
                  className="column__newTaskInput"
                  value=""
                  placeholder="New task…"
                  readOnly
                  tabIndex={-1}
                />
                <button
                  className="btn btn--subtle"
                  type="button"
                  disabled
                  tabIndex={-1}
                >
                  Add
                </button>
              </div>

              <div className="taskList" role="list" aria-hidden="true">
                {fullTasks.length === 0 ? (
                  <div className="taskList__empty">No tasks</div>
                ) : (
                  fullTasks.map((t) => (
                    <div
                      key={t.id}
                      className={[
                        "task",
                        "task--dragPreview",
                        t.completed ? "task--completed" : "",
                        visibleSet.has(t.id) ? "" : "task--dimmed",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <span className="task__dragHandle" aria-hidden="true">
                        ⋮⋮
                      </span>
                      <span className="task__select" aria-hidden="true">
                        <input
                          type="checkbox"
                          checked={false}
                          readOnly
                          tabIndex={-1}
                        />
                      </span>
                      <span className="task__check" aria-hidden="true">
                        <input
                          className="task__completeBox"
                          type="checkbox"
                          checked={t.completed}
                          readOnly
                          tabIndex={-1}
                        />
                      </span>
                      <span className="task__title" aria-hidden="true">
                        {t.title}
                      </span>
                      <span className="iconBtn" aria-hidden="true">
                        🗑
                      </span>
                    </div>
                  ))
                )}
              </div>

              <footer className="column__footer">
                <span className="btn btn--subtle" aria-hidden="true">
                  Select all
                </span>
                <span className="btn btn--danger" aria-hidden="true">
                  Delete column
                </span>
              </footer>
            </div>,
            dragPreview.container,
          )
        : null}
    </>
  );
}
