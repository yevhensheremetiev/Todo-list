# Todo board (React + TypeScript)

Kanban-style todo board: multiple columns, tasks with completion and inline edit, multi-select with bulk actions, search and status filter, drag-and-drop for tasks and columns, and persisted state in the browser.

## Features

- Add/remove/rename columns; reorder columns by dragging the column header handle
- Add tasks (per column), edit titles (double-click), delete, mark complete/incomplete
- Select tasks (including “select all” per column), bulk complete / incomplete / move / delete
- Search (substring + simple fuzzy subsequence match) with match highlighting in titles
- Filter by All / Active / Completed
- Drag tasks by the **⋮⋮** handle to reorder within a column or move between columns; multi-selected tasks move together when the dragged task is part of the selection
- State persisted with **Redux Toolkit** + **redux-persist** (localStorage)

## Prerequisites

- Node.js 20+ (LTS recommended)

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

## Lint

```bash
npm run lint
```