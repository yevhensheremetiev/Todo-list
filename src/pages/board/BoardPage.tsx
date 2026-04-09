import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { Fragment, useEffect, useState } from "react";
import { Column } from "./Column.tsx";
import type { StatusFilter } from "../../types/board.ts";
import "../../styles/board.css";
import { useAppDispatch, useAppSelector } from "../../state/store/hooks.ts";
import { boardActions } from "../../state/store/boardSlice.ts";
import type { RootState } from "../../state/store/store.ts";
import { ColumnDropGap } from "../../dnd/ColumnDropGap.tsx";
import { DndDragContext } from "../../dnd/DndDragContext.tsx";
import { filterTasksForDisplay } from "../../state/selectors/boardSelectors.ts";

type Props = {
  searchQuery: string;
  statusFilter: StatusFilter;
};

export function BoardPage({ searchQuery, statusFilter }: Props) {
  const state = useAppSelector((s: RootState) => s.board);
  const dispatch = useAppDispatch();
  const [dragSource, setDragSource] = useState<Record<string, unknown> | null>(
    null,
  );

  const isFiltering = searchQuery.trim().length > 0 || statusFilter !== "all";
  const visibleColumnIds = isFiltering
    ? state.columnOrder.filter((columnId) => {
        const col = state.columnsById[columnId];
        if (!col) return false;
        const fullTasks = col.taskIds
          .map((id) => state.tasksById[id])
          .filter(Boolean);
        const visibleTasks = filterTasksForDisplay(
          fullTasks,
          searchQuery,
          statusFilter,
        );
        return visibleTasks.length > 0;
      })
    : state.columnOrder;

  useEffect(() => {
    return monitorForElements({
      onDragStart: ({ source }) => setDragSource(source.data),
      onDrop: () => setDragSource(null),
    });
  }, []);

  const visibleColumnCanonicalInsertAt = (gapIndexInVisibleList: number) => {
    const ids = visibleColumnIds;
    if (ids.length === 0) return 0;
    const clamped = Math.max(0, Math.min(gapIndexInVisibleList, ids.length));

    if (clamped === 0) return state.columnOrder.indexOf(ids[0]);
    if (clamped === ids.length)
      return state.columnOrder.indexOf(ids[ids.length - 1]) + 1;

    const nextId = ids[clamped];
    return state.columnOrder.indexOf(nextId);
  };

  return (
    <DndDragContext.Provider value={{ dragSource }}>
      <section className="board" aria-label="Todo board">
        <div className="board__columns" role="list">
          <ColumnDropGap insertAt={visibleColumnCanonicalInsertAt(0)} />
          {visibleColumnIds.map((columnId, columnIndex) => (
            <Fragment key={columnId}>
              <div role="listitem" className="board__columnWrap">
                <Column
                  column={state.columnsById[columnId]}
                  tasksById={state.tasksById}
                  columnIndex={state.columnOrder.indexOf(columnId)}
                  searchQuery={searchQuery}
                  statusFilter={statusFilter}
                  selection={state.selection.taskIds}
                  onToggleSelect={(taskId) =>
                    dispatch(boardActions.selectionToggle({ taskId }))
                  }
                  onSelectAll={() =>
                    dispatch(
                      boardActions.selectionSelectAllInColumn({ columnId }),
                    )
                  }
                  onDeselectAll={() =>
                    dispatch(
                      boardActions.selectionDeselectAllInColumn({ columnId }),
                    )
                  }
                />
              </div>
              <ColumnDropGap
                insertAt={visibleColumnCanonicalInsertAt(columnIndex + 1)}
              />
            </Fragment>
          ))}
        </div>
      </section>
    </DndDragContext.Provider>
  );
}
