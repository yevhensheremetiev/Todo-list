import { createContext, useContext } from 'react'

export type DndDragContextValue = {
  dragSource: Record<string, unknown> | null
}

export const DndDragContext = createContext<DndDragContextValue>({ dragSource: null })

export function useDndDragSource() {
  return useContext(DndDragContext)
}
