import { memo } from "react";
import type { Task } from "../../types/board.ts";
import { cn } from "../../utils/cn.ts";

type Props = {
  title: string;
  width: number;
  height: number;
  fullTasks: readonly Task[];
  visibleTaskIdSet: ReadonlySet<string>;
  shownCount: number;
};

function ColumnDragPreviewComponent({
  title,
  width,
  height,
  fullTasks,
  visibleTaskIdSet,
  shownCount,
}: Props) {
  return (
    <div
      className="column column--dragPreview"
      style={{ width, height }}
      aria-hidden="true"
    >
      <header className="column__header">
        <span className="column__dragHandle" aria-hidden="true">
          ⋮⋮
        </span>
        <div className="column__headerText">
          <div className="column__title" aria-hidden="true">
            {title}
          </div>
          <div className="column__meta" aria-hidden="true">
            {shownCount} shown · {fullTasks.length} total
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
        <button className="btn btn--subtle" type="button" disabled tabIndex={-1}>
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
              className={cn(
                "task",
                "task--dragPreview",
                t.completed ? "task--completed" : "",
                visibleTaskIdSet.has(t.id) ? "" : "task--dimmed",
              )}
            >
              <span className="task__dragHandle" aria-hidden="true">
                ⋮⋮
              </span>
              <span className="task__select" aria-hidden="true">
                <input type="checkbox" checked={false} readOnly tabIndex={-1} />
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
    </div>
  );
}

export const ColumnDragPreview = memo(ColumnDragPreviewComponent);

