import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { pointerOutsideOfPreview } from "@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { Task } from "../../types/board.ts";
import { DND_COLUMN } from "../../types/dnd.ts";
import { ColumnDragPreview } from "./ColumnDragPreview.tsx";

type DragPreviewState =
  | { type: "idle" }
  | { type: "preview"; container: HTMLElement; width: number; height: number };

export function useColumnDraggable(params: {
  handleRef: React.RefObject<HTMLButtonElement | null>;
  columnId: string;
  columnIndex: number;
  title: string;
  fullTasks: readonly Task[];
  visibleTaskIds: readonly string[];
  selectedTaskIds: readonly string[];
  shownCount: number;
}) {
  const {
    handleRef,
    columnId,
    columnIndex,
    title,
    fullTasks,
    visibleTaskIds,
    selectedTaskIds,
    shownCount,
  } = params;

  const [isDragging, setIsDragging] = useState(false);
  const [dragPreview, setDragPreview] = useState<DragPreviewState>({
    type: "idle",
  });

  const visibleTaskIdSet = useMemo(
    () => new Set(visibleTaskIds),
    [visibleTaskIds],
  );

  const selectedTaskIdSet = useMemo(
    () => new Set(selectedTaskIds),
    [selectedTaskIds],
  );

  useEffect(() => {
    const handle = handleRef.current;
    if (!handle) return;

    return draggable({
      element: handle,
      getInitialData: () => ({
        dnd: DND_COLUMN,
        columnId,
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
  }, [handleRef, columnId, columnIndex]);

  const previewPortal =
    dragPreview.type === "preview"
      ? createPortal(
          <ColumnDragPreview
            title={title}
            width={dragPreview.width}
            height={dragPreview.height}
            fullTasks={fullTasks}
            visibleTaskIdSet={visibleTaskIdSet}
            selectedTaskIdSet={selectedTaskIdSet}
            shownCount={shownCount}
          />,
          dragPreview.container,
        )
      : null;

  return { isDragging, previewPortal };
}

