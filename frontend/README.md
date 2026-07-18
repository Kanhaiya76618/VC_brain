# ResearchOS — AI-Native Research Operating System

## Overview

ResearchOS is a full-stack Next.js application that automates literature discovery, curriculum generation, knowledge-graph construction, and critique for any research topic.

---

## Running Locally

```bash
npm install
npm run dev
# → http://localhost:4028
```

---

## Architecture

```
src/
├── app/
│   ├── page.tsx                    # Home — search hero + workspace list
│   ├── curriculum-view/page.tsx    # Curriculum board + knowledge graph + critic
│   ├── paper-reader/page.tsx       # Library explorer + paper detail + notes
│   └── api/
│       ├── curriculum/route.ts     # POST { topic } → curriculum JSON
│       └── critique/route.ts       # POST { paperId | curriculumId } → critique JSON
├── components/
│   ├── AppShell.tsx                # Root window chrome (TopNav + Dock + ambient bg)
│   ├── TopNav.tsx                  # macOS menu-bar style top strip
│   ├── Dock.tsx                    # Bottom icon tray with proximity magnification
│   ├── SpotlightSearch.tsx         # ⌘K overlay search
│   ├── StatusBadge.tsx             # Agent state pill (idle/running/done/error)
│   ├── PipelineLoader.tsx          # 5-stage animated pipeline progress
│   ├── WorkspaceSwitcher.tsx       # Stage Manager-style workspace thumbnails
│   └── NotesPanel.tsx              # Bottom/side sheet for per-paper notes
└── lib/
    └── mock/
        └── data.ts                 # ← MOCK DATA LAYER (swap here for real API)
```

---

## Swapping Mock Data for Real API Calls

All mock data lives in **`src/lib/mock/data.ts`**. Each export includes a comment showing the exact `fetch()` call to replace it with.

### Curriculum

In `src/lib/mock/data.ts`, find `MOCK_CURRICULUM` and replace with:

```ts
// Before (mock):
export const MOCK_CURRICULUM = { ... };

// After (real API):
export async function fetchCurriculum(topic: string) {
  const res = await fetch('/api/curriculum', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic }),
  });
  return res.json(); // Returns same shape as MOCK_CURRICULUM
}
```

Then in `src/app/curriculum-view/page.tsx`, replace the static import with a `useEffect` + `fetchCurriculum(topic)` call.

### Critique

In `src/lib/mock/data.ts`, find `MOCK_CRITIQUE` and replace with:

```ts
// Before (mock):
export const MOCK_CRITIQUE = { ... };

// After (real API):
export async function fetchCritique(curriculumId: string) {
  const res = await fetch('/api/critique', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ curriculumId }),
  });
  return res.json(); // Returns same shape as MOCK_CRITIQUE
}
```

Then in `src/app/curriculum-view/components/CriticPanel.tsx`, replace the static import with a `useEffect` + `fetchCritique(curriculumId)` call.

---

## Design System

- **Visual language**: White-first macOS glassmorphism — `backdrop-blur`, 1px white borders, soft diffused shadows, inner specular highlights
- **Accent palette**: Indigo (primary actions), Teal (done/healthy), Amber (warnings/gaps), Coral (critique/errors), Purple (graph nodes)
- **Typography**: DM Sans + JetBrains Mono, semibold headings, generous letter-spacing on labels
- **Motion**: Framer Motion spring physics throughout — `stiffness: 300-500, damping: 25-40`

---

## Key Components

| Component | Location | Purpose |
|---|---|---|
| `AppShell` | `src/components/AppShell.tsx` | Root window chrome |
| `TopNav` | `src/components/TopNav.tsx` | macOS menu bar |
| `Dock` | `src/components/Dock.tsx` | Bottom icon tray with magnification |
| `SpotlightSearch` | `src/components/SpotlightSearch.tsx` | ⌘K search overlay |
| `CurriculumBoard` | `src/app/curriculum-view/components/CurriculumBoard.tsx` | Drag-to-reorder modules |
| `KnowledgeGraphView` | `src/app/curriculum-view/components/KnowledgeGraphView.tsx` | Interactive SVG graph |
| `CoverageMeter` | `src/app/curriculum-view/components/CoverageMeter.tsx` | Animated coverage ring |
| `CriticPanel` | `src/app/curriculum-view/components/CriticPanel.tsx` | Critique suggestion chips |
| `LibraryExplorer` | `src/app/paper-reader/components/LibraryExplorer.tsx` | CoverFlow + grid/list |
| `NotesPanel` | `src/components/NotesPanel.tsx` | Per-paper notes sheet |
| `PipelineLoader` | `src/components/PipelineLoader.tsx` | 5-stage pipeline progress |
| `WorkspaceSwitcher` | `src/components/WorkspaceSwitcher.tsx` | Stage Manager thumbnails |
| `StatusBadge` | `src/components/StatusBadge.tsx` | Agent state indicator |
