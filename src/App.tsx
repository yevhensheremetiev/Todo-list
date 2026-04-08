import { useMemo, useState } from 'react'
import { BoardPage } from './pages/board/BoardPage.tsx'
import type { StatusFilter } from './types/board.ts'
import { IconButton } from './components/IconButton.tsx'
import { SegmentedControl } from './components/SegmentedControl.tsx'
import { TextInput } from './components/TextInput.tsx'
import './styles/app.css'

export function App() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const filterOptions = useMemo(
    () => [
      { value: 'all' as const, label: 'All' },
      { value: 'incomplete' as const, label: 'Active' },
      { value: 'completed' as const, label: 'Completed' },
    ],
    [],
  )

  return (
    <div className="appShell">
      <header className="topBar">
        <div className="topBar__left">
          <div className="appTitle">
            <div className="appTitle__name">Todo board</div>
            <div className="appTitle__hint">Columns, multi-select, drag &amp; drop</div>
          </div>
        </div>

        <div className="topBar__center">
          <TextInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search tasks…"
            ariaLabel="Search tasks"
          />
        </div>

        <div className="topBar__right">
          <SegmentedControl
            ariaLabel="Filter tasks by status"
            value={statusFilter}
            options={filterOptions}
            onChange={(v) => setStatusFilter(v)}
          />
          <IconButton
            title="Clear search"
            ariaLabel="Clear search"
            onClick={() => setSearchQuery('')}
            disabled={!searchQuery}
          >
            ✕
          </IconButton>
        </div>
      </header>

      <main className="content">
        <BoardPage searchQuery={searchQuery} statusFilter={statusFilter} />
      </main>
    </div>
  )
}

