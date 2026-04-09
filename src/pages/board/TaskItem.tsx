import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ColumnId, Task } from "../../types/board.ts";
import type { MatchIndexRange } from "../../utils/search.ts";
import {
  highlightMatchParts,
  highlightPartsFromIndices,
} from "../../utils/search.ts";
import { cn } from "../../utils/cn.ts";
import { useAppDispatch } from "../../state/store/hooks.ts";
import { boardActions } from "../../state/store/boardSlice.ts";
import { DND_TASK } from "../../types/dnd.ts";
import { pointerOutsideOfPreview } from "@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";

type Props = {
  task: Task;
  columnId: ColumnId;
  index: number;
  searchQuery: string;
  matchIndices?: readonly MatchIndexRange[];
  selected: boolean;
  dimmed: boolean;
  selectedCount: number;
  groupDragActive: boolean;
  orderedSelectionTaskIds?: readonly string[];
  tasksByIdForPreview?: Record<string, Task>;
  onToggleSelect: (taskId: string) => void;
};

type DragPreviewState =
  | { type: "idle" }
  | { type: "preview"; container: HTMLElement; width: number };

function TaskItemComponent({
  task,
  columnId,
  index,
  searchQuery,
  matchIndices,
  selected,
  dimmed,
  selectedCount,
  groupDragActive,
  orderedSelectionTaskIds,
  tasksByIdForPreview,
  onToggleSelect,
}: Props) {
  const dispatch = useAppDispatch();
  const handleRef = useRef<HTMLButtonElement>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [dragPreview, setDragPreview] = useState<DragPreviewState>({
    type: "idle",
  });
  const showMultiPreview =
    selected &&
    selectedCount > 1 &&
    !!orderedSelectionTaskIds &&
    !!tasksByIdForPreview;
  const orderedSelectedTaskIds = useMemo(() => {
    if (!showMultiPreview) return [];
    return orderedSelectionTaskIds ?? [];
  }, [showMultiPreview, orderedSelectionTaskIds]);

  const parts = useMemo(() => {
    if (matchIndices && matchIndices.length > 0)
      return highlightPartsFromIndices(task.title, matchIndices);
    return highlightMatchParts(task.title, searchQuery);
  }, [task.title, searchQuery, matchIndices]);

  useEffect(() => {
    const handle = handleRef.current;
    if (!handle) return;
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
        setIsDragging(false);
        setDragPreview({ type: "idle" });
      },
      onGenerateDragPreview: ({ nativeSetDragImage }) => {
        setCustomNativeDragPreview({
          nativeSetDragImage,
          getOffset: pointerOutsideOfPreview({ x: "8px", y: "8px" }),
          render: ({ container }) => {
            const taskEl = handle.closest(".task") as HTMLElement | null;
            const rect = taskEl?.getBoundingClientRect();
            const width = Math.max(240, Math.round(rect?.width ?? 360));
            setDragPreview({ type: "preview", container, width });
            return () => setDragPreview({ type: "idle" });
          },
        });
      },
    });
  }, [task.id, columnId, index]);

  const saveEdit = () => {
    const t = draft.trim();
    if (!t) {
      setDraft(task.title);
      setEditing(false);
      return;
    }
    if (t !== task.title)
      dispatch(boardActions.taskRename({ taskId: task.id, title: t }));
    setEditing(false);
  };

  return (
    <>
      <div
        className={cn("task", {
          "task--completed": task.completed,
          "task--dimmed": dimmed,
          "task--selected": selected,
          "task--dragging": isDragging || (groupDragActive && selected),
        })}
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
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(task.id)}
            aria-label="Select task"
          />
        </label>

        {editing ? (
          <input
            className="task__editInput"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveEdit();
              if (e.key === "Escape") {
                setDraft(task.title);
                setEditing(false);
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
              setDraft(task.title);
              setEditing(true);
            }}
          >
            {parts.map((p, idx) =>
              p.type === "match" ? (
                <mark key={idx}>{p.text}</mark>
              ) : (
                <span key={idx}>{p.text}</span>
              ),
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

      {dragPreview.type === "preview"
        ? createPortal(
            showMultiPreview ? (
              <div
                className="taskPreviewList"
                style={{ width: dragPreview.width }}
              >
                {orderedSelectedTaskIds.map((id) => {
                  const t = tasksByIdForPreview?.[id];
                  if (!t) return null;
                  return (
                    <div
                      key={id}
                      className={cn(
                        "task",
                        "task--dragPreview",
                        t.completed ? "task--completed" : "",
                      )}
                      style={{ width: dragPreview.width }}
                    >
                      <span className="task__dragHandle" aria-hidden="true">
                        ⋮⋮
                      </span>
                      <span className="task__select" aria-hidden="true">
                        <input type="checkbox" checked readOnly tabIndex={-1} />
                      </span>
                      <span className="task__title" aria-hidden="true">
                        {t.title}
                      </span>
                      <span className="iconBtn" aria-hidden="true">
                        🗑
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="taskPreviewStack">
                <div
                  className={cn(
                    "task",
                    "task--dragPreview",
                    task.completed ? "task--completed" : "",
                    selected ? "task--selected" : "",
                  )}
                  style={{ width: dragPreview.width }}
                >
                  <span className="task__dragHandle" aria-hidden="true">
                    ⋮⋮
                  </span>
                  <span className="task__select" aria-hidden="true">
                    <input
                      type="checkbox"
                      checked={selected}
                      readOnly
                      tabIndex={-1}
                    />
                  </span>
                  <span className="task__title" aria-hidden="true">
                    {parts.map((p, idx) =>
                      p.type === "match" ? (
                        <mark key={idx}>{p.text}</mark>
                      ) : (
                        <span key={idx}>{p.text}</span>
                      ),
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
  );
}

export const TaskItem = memo(TaskItemComponent);
