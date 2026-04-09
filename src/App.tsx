import { useEffect, useState } from "react";
import { BoardPage } from "./pages/board/BoardPage.tsx";
import type { StatusFilter } from "./types/board.ts";
import { SegmentedControl } from "./components/SegmentedControl.tsx";
import { TextInput } from "./components/TextInput.tsx";
import { BulkToolbar } from "./pages/board/BulkToolbar.tsx";
import { useAppDispatch } from "./state/store/hooks.ts";
import { boardActions } from "./state/store/boardSlice.ts";
import "./styles/app.css";

export function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [isHeaderToggleEnabled, setIsHeaderToggleEnabled] = useState(false);
  const dispatch = useAppDispatch();

  const filterOptions = [
    { value: "all" as const, label: "All" },
    { value: "incomplete" as const, label: "Active" },
    { value: "completed" as const, label: "Completed" },
  ];

  useEffect(() => {
    const mq = window.matchMedia("(max-height: 650px)");

    const sync = () => {
      const enabled = mq.matches;
      setIsHeaderToggleEnabled(enabled);
      if (!enabled) setIsHeaderCollapsed(false);
    };

    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <div className="appShell">
      <header
        className={["topBar", isHeaderCollapsed ? "topBar--collapsed" : ""]
          .filter(Boolean)
          .join(" ")}
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
        className={[
          "content",
          isHeaderToggleEnabled && isHeaderCollapsed
            ? "content--withMicroHeader"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <BoardPage searchQuery={searchQuery} statusFilter={statusFilter} />
      </main>
    </div>
  );
}
