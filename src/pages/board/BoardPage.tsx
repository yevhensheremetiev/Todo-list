import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Column } from "./Column.tsx";
import type { StatusFilter } from "../../types/board.ts";
import "../../styles/board.css";
import { useAppDispatch, useAppSelector } from "../../state/store/hooks.ts";
import { boardActions } from "../../state/store/boardSlice.ts";
import type { RootState } from "../../state/store/store.ts";
import { ColumnDropGap } from "../../dnd/ColumnDropGap.tsx";
import { DndDragContext } from "../../dnd/DndDragContext.tsx";
import {
  filterTasksForDisplay,
  selectOrderedSelectionTaskIds,
} from "../../state/selectors/boardSelectors.ts";
import { canonicalInsertAt } from "../../utils/canonicalInsertAt.ts";

type Props = {
  searchQuery: string;
  statusFilter: StatusFilter;
};

export function BoardPage({ searchQuery, statusFilter }: Props) {
  const columnOrder = useAppSelector((s: RootState) => s.board.columnOrder);
  const columnsById = useAppSelector((s: RootState) => s.board.columnsById);
  const tasksById = useAppSelector((s: RootState) => s.board.tasksById);
  const selectionTaskIds = useAppSelector(
    (s: RootState) => s.board.selection.taskIds,
  );
  const orderedSelectionTaskIds = useAppSelector((s: RootState) =>
    selectOrderedSelectionTaskIds(s),
  );
  const dispatch = useAppDispatch();
  const [dragSource, setDragSource] = useState<Record<string, unknown> | null>(
    null,
  );

  const columnIndexById = useMemo(() => {
    const m = new Map<string, number>();
    for (let i = 0; i < columnOrder.length; i++) m.set(columnOrder[i], i);
    return m;
  }, [columnOrder]);

  const isFiltering = searchQuery.trim().length > 0 || statusFilter !== "all";
  const visibleColumnIds = isFiltering
    ? columnOrder.filter((columnId) => {
        const col = columnsById[columnId];
        if (!col) return false;
        const fullTasks = col.taskIds
          .map((id) => tasksById[id])
          .filter(Boolean);
        const visibleTasks = filterTasksForDisplay(
          fullTasks,
          searchQuery,
          statusFilter,
        );
        return visibleTasks.length > 0;
      })
    : columnOrder;

  useEffect(() => {
    return monitorForElements({
      onDragStart: ({ source }) => setDragSource(source.data),
      onDrop: () => setDragSource(null),
    });
  }, []);

  const visibleColumnCanonicalInsertAt = (gapIndexInVisibleList: number) =>
    canonicalInsertAt({
      fullIds: columnOrder,
      visibleIds: visibleColumnIds,
      gapIndexInVisibleList,
      fullIndexById: columnIndexById,
    });

  const onToggleSelect = useCallback(
    (taskId: string) => dispatch(boardActions.selectionToggle({ taskId })),
    [dispatch],
  );

  const onSelectAllInColumn = useCallback(
    (columnId: string) =>
      dispatch(boardActions.selectionSelectAllInColumn({ columnId })),
    [dispatch],
  );

  const onDeselectAllInColumn = useCallback(
    (columnId: string) =>
      dispatch(boardActions.selectionDeselectAllInColumn({ columnId })),
    [dispatch],
  );

  return (
    <DndDragContext.Provider value={{ dragSource }}>
      <section className="board" aria-label="Todo board">
        <div className="board__columns" role="list">
          <ColumnDropGap insertAt={visibleColumnCanonicalInsertAt(0)} />
          {visibleColumnIds.map((columnId, columnIndex) => (
            <Fragment key={columnId}>
              <div role="listitem" className="board__columnWrap">
                <Column
                  column={columnsById[columnId]}
                  tasksById={tasksById}
                  columnIndex={columnIndexById.get(columnId) ?? 0}
                  searchQuery={searchQuery}
                  statusFilter={statusFilter}
                  selection={selectionTaskIds}
                  orderedSelectionTaskIds={orderedSelectionTaskIds}
                  onToggleSelect={onToggleSelect}
                  onSelectAll={() => onSelectAllInColumn(columnId)}
                  onDeselectAll={() => onDeselectAllInColumn(columnId)}
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
