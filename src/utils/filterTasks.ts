import type { StatusFilter, Task } from '../types/board'
import { fuzzyMatch } from './search'

export function taskMatchesStatus(task: Task, statusFilter: StatusFilter): boolean {
  if (statusFilter === 'completed') return task.completed
  if (statusFilter === 'incomplete') return !task.completed
  return true
}

export function taskMatchesSearch(task: Task, searchQuery: string): boolean {
  const q = searchQuery.trim()
  if (!q) return true
  return fuzzyMatch(task.title, q)
}
