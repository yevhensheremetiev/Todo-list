import { useEffect, useState } from "react";
import { BoardPage } from "./pages/board/BoardPage.tsx";
import type { StatusFilter } from "./types/board.ts";
import { SegmentedControl } from "./components/SegmentedControl.tsx";
import { TextInput } from "./components/TextInput.tsx";
import { BulkToolbar } from "./pages/board/BulkToolbar.tsx";
import { useAppDispatch } from "./state/store/hooks.ts";
import { boardActions } from "./state/store/boardSlice.ts";
import { useMediaQuery } from "./hooks/useMediaQuery.ts";
import { cn } from "./utils/cn.ts";
import "./styles/app.css";

export function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const dispatch = useAppDispatch();
  const isHeaderToggleEnabled = useMediaQuery("(max-height: 650px)");

  const filterOptions = [
    { value: "all" as const, label: "All" },
    { value: "incomplete" as const, label: "Active" },
    { value: "completed" as const, label: "Completed" },
  ];

  useEffect(() => {
    if (!isHeaderToggleEnabled) setIsHeaderCollapsed(false);
  }, [isHeaderToggleEnabled]);

  return (
    <div className="appShell">
      <header
        className={cn("topBar", { "topBar--collapsed": isHeaderCollapsed })}
      >
        <div className="topBar__row">
          <div className="topBar__left">
            <div className="appTitle">
              <div className="appTitle__name">Todo board</div>
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
            <button
              type="button"
              className="btn btn--subtle"
              onClick={() => dispatch(boardActions.columnAdd({}))}
            >
              + Column
            </button>
            <SegmentedControl
              ariaLabel="Filter tasks by status"
              value={statusFilter}
              options={filterOptions}
              onChange={(v) => setStatusFilter(v)}
            />
          </div>
        </div>

        <div className="topBar__bulk">
          <BulkToolbar />
        </div>

        {isHeaderToggleEnabled && !isHeaderCollapsed ? (
          <div className="topBar__toggleRow">
            <button
              type="button"
              className="headerToggle"
              onClick={() => setIsHeaderCollapsed(true)}
              aria-label="Hide header"
              title="Hide header"
            >
              ⌃
            </button>
          </div>
        ) : null}
      </header>

      {isHeaderToggleEnabled && isHeaderCollapsed ? (
        <div className="microHeader">
          <button
            type="button"
            className="headerToggle"
            onClick={() => setIsHeaderCollapsed(false)}
            aria-label="Show header"
            title="Show header"
          >
            ⌄
          </button>
        </div>
      ) : null}

      <main
        className={cn(
          "content",
          { "content--withMicroHeader": isHeaderToggleEnabled && isHeaderCollapsed },
        )}
      >
        <BoardPage searchQuery={searchQuery} statusFilter={statusFilter} />
      </main>
    </div>
  );
}
