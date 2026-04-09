import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { useEffect, useState } from "react";

type CanDrop = NonNullable<Parameters<typeof dropTargetForElements>[0]["canDrop"]>;
type CanDropArgs = Parameters<CanDrop>[0];

type OnDrop = NonNullable<Parameters<typeof dropTargetForElements>[0]["onDrop"]>;
type OnDropArgs = Parameters<OnDrop>[0];

export type DropGapCanDropArgs = CanDropArgs;
export type DropGapOnDropArgs = OnDropArgs;

export function useDropGap(params: {
  element: HTMLElement | null;
  canDrop: (args: CanDropArgs) => boolean;
  getData: () => Record<string, unknown>;
  onDrop: (args: OnDropArgs) => void;
}) {
  const { element, canDrop, getData, onDrop } = params;
  const [isOver, setIsOver] = useState(false);

  useEffect(() => {
    const el = element;
    if (!el) return;
    return dropTargetForElements({
      element: el,
      getData,
      canDrop,
      onDragEnter: () => setIsOver(true),
      onDragLeave: () => setIsOver(false),
      onDrop: (args) => {
        setIsOver(false);
        onDrop(args);
      },
    });
  }, [element, canDrop, getData, onDrop]);

  return { isOver };
}

