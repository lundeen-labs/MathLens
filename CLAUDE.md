# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# MathLens

Interactive math visualization app for visual learners. Browse preset functions, click to plot, drag sliders to see real-time changes. No typing math — everything is point-and-click.

**Repo**: https://github.com/lundeen-labs/MathLens
**Location**: `E:\source\repos\Applications\MathLens`

## Recent Changes (2026-05-28)

- **Light/dark theme** — toolbar sun/moon toggle, `viewStore.theme`, `:root[data-theme]` CSS vars, persisted.
- **Plot + view persistence** — `functionStore` and `viewStore` persist to `localStorage` (zustand `persist`); active functions and view survive refresh.
- **Share links actually work** — `App.tsx` decodes `?functions=` on mount (was encode-only/dead before).
- **History populates** — `functionStore.addFunction` now funnels every add into `historyStore.addEntry`.
- **Hover-trace readout** — hovering the 2D canvas snaps a dot to the traced curve with a live `name = f(x)` badge.
- **Asymptote streaks gone** — Canvas2D evaluator returns `NaN` past a magnitude limit so `tan`/`sec`/`1/x` break cleanly.
- **Polar grid is honest** — `PolarGrid` now renders in `Canvas2D` when `gridType==='polar'`; `spherical` is restricted to 3D.
- **Code-splitting** — `Canvas3D` (Three.js), overlay panels, and the nerdamer algebra path are `React.lazy`; initial JS dropped ~3159 kB → ~1950 kB.
- **Layout scroll-zone infra** — each sidebar tab owns a `flex-1 min-h-0 overflow-y-auto` region; the Browse "Custom Expression" bar is a pinned footer; `ParamSliders` is height-capped. Fixes components being cut off / buried.
- **Accessibility** — overlay panels are `role="dialog"` with Esc-to-close + focus; sidebar tabs use `role="tab"`/`aria-selected`; toolbar buttons use `aria-pressed`.

## Build & Run

```powershell
npm run dev        # Dev server at http://localhost:5173/
npm run build      # tsc -b && vite build (production)
npm run lint       # ESLint
npm run preview    # Preview production build
```

## Tech Stack

| Layer        | Technology                                       |
|-------------|--------------------------------------------------|
| Framework   | React 19 + TypeScript 5.9 + Vite 8               |
| CSS         | Tailwind CSS v4 (`@tailwindcss/vite` plugin)      |
| 2D Canvas   | Mafs 0.21 (SVG-based math plots)                  |
| 3D Canvas   | Three.js 0.183 via @react-three/fiber 9 + drei 10 |
| Math Engine | mathjs 15 (parsing/eval) + nerdamer (symbolic)    |
| LaTeX       | KaTeX 0.16 via react-katex                        |
| State       | Zustand 5 (5 stores; functionStore + viewStore persist to localStorage) |
| Animation   | framer-motion 12                                  |
| UI          | Radix UI (slider, dialog, tabs, tooltip, popover) |

## Project Structure

```
src/
├── App.tsx                    # Root: applies viewStore.theme to <html>, decodes ?functions= share links on mount
├── main.tsx                   # Entry point
├── index.css                  # CSS vars (dark + light themes via [data-theme]), Tailwind v4 import, Mafs overrides
│
├── canvas/                    # Rendering
│   ├── Canvas2D.tsx           # Mafs 2D canvas: ResizeObserver full-height, discontinuity-aware eval (NaN past limit), hover-trace marker, PolarGrid mount
│   ├── Canvas2DWrapper.tsx    # Wrapper for 2D canvas context
│   ├── Canvas3D.tsx           # Three.js 3D canvas + spherical grid support
│   ├── ParametricPlot2D.tsx   # Mafs parametric curve (x(t), y(t)) with trace
│   ├── ParametricPlot3D.tsx   # Three.js 3D parametric curve with trace
│   ├── controls/
│   │   └── ViewControls.tsx   # Pan/zoom controls
│   ├── grids/
│   │   ├── PolarGrid.tsx      # Polar coordinate grid overlay
│   │   └── SphericalGrid.tsx  # Spherical lat/lon grid for 3D (ρ=f(θ,φ))
│   └── layers/                # (empty — future layer system)
│
├── composer/                  # Function browsing & composition
│   ├── FunctionBrowser.tsx    # Category-grouped preset function cards
│   ├── FunctionList.tsx       # Active function list with visibility toggles
│   ├── FunctionBar.tsx        # Expression input bar with autocomplete
│   ├── ParamSliders.tsx       # Real-time parameter adjustment sliders
│   ├── FunctionCombiner.tsx   # Compose functions: f+g, f∘g, f*g operations
│   ├── SnapBlocks.tsx         # Drag-and-drop function building blocks
│   ├── SigmaNotation.tsx      # Σ summation explorer — 6 series, bar chart, convergence
│   ├── TransformControls.tsx  # Shift/scale/reflect transforms with LaTeX preview
│   └── ParametricAnimator.tsx # Parametric tab controls — preset cards + sliders, drives ParametricPlot2D/3D
│
├── engine/                    # Math processing
│   ├── evaluator.ts           # math.js compile & evaluate (points, asymptotes)
│   ├── parser.ts              # Expression parsing & validation
│   ├── presets.ts             # 28 preset functions across 6 categories
│   └── symbolic.ts            # nerdamer symbolic ops (simplify, derive, integrate)
│
├── store/                     # Zustand state management
│   ├── functionStore.ts       # Active functions, params, selection, colors — persisted; addFunction logs to historyStore
│   ├── viewStore.ts           # View mode, grid, theme (dark/light), sidebar tab, panels — mode/grid/theme/viewport persisted
│   ├── animStore.ts           # Animation state (playing, speed, time)
│   ├── historyStore.ts        # Expression history tracking
│   └── parametricStore.ts     # Parametric curve state (x(t), y(t), z(t), presets)
│
├── ui/                        # Layout & panels
│   ├── Layout.tsx             # Main layout: toolbar + sidebar (5 tabs, per-tab scroll zones) + canvas + AlgebraPanel + overlays. Lazy Canvas3D/panels; Esc-closes overlays
│   ├── Toolbar.tsx            # Top bar: view modes, grid cycle, panel toggles, theme toggle (sun/moon)
│   ├── HistoryPanel.tsx       # Expression history overlay with search
│   ├── ExportPanel.tsx        # Export & share overlay (SVG, PNG, LaTeX, link)
│   └── GuidedExplorations.tsx # Step-by-step math exploration walkthroughs
│
├── panels/                    # Side panels
│   ├── AlgebraPanel.tsx       # Algebra workspace
│   ├── AlgebraSteps.tsx       # Step-by-step algebra solution display
│   ├── AnimationControls.tsx  # Play/pause/speed controls
│   └── Properties.tsx         # Function properties inspector
│
├── animations/                # Animation utilities
│   ├── fourier.ts             # Fourier transform animation
│   ├── morph.ts               # Function morphing transitions
│   ├── trace.ts               # Point tracing along curves
│   └── useAnimation.ts        # Animation hook (requestAnimationFrame)
│
└── types/                     # TypeScript types
    ├── function.ts            # MathFunction, FunctionParam, EvalResult, categories
    ├── nerdamer.d.ts          # Type stubs for nerdamer (no @types)
    └── react-katex.d.ts       # Type stubs for react-katex (no @types)
```

## Architecture

### Data Flow
```
User clicks preset card → functionStore.addFunction()
  → Canvas2D subscribes to functionStore
  → evaluator.ts compiles expression with math.js
  → Points rendered via Mafs <Plot.OfX>
  → ParamSliders onChange → functionStore.updateParam() → re-evaluate → re-render
```

### Sidebar Tabs (viewStore.sidebarTab — `browse` | `compose` | `sigma` | `transform` | `parametric`)
| Tab label   | sidebarTab value | Component(s)                                  |
|-------------|------------------|-----------------------------------------------|
| Browse      | `browse`         | FunctionBrowser → FunctionList + FunctionBar  |
| Compose     | `compose`        | SnapBlocks + FunctionCombiner                 |
| Σ           | `sigma`          | SigmaNotation (series explorer)               |
| Transform   | `transform`      | TransformControls (shift/scale/reflect)       |
| P(t)        | `parametric`     | ParametricAnimator (curve presets + sliders)  |

ParamSliders renders at the bottom of the center canvas area (not inside a tab). The right-side AlgebraPanel manages its own `<aside>` + AnimatePresence, toggled via `viewStore.algebraPanelOpen`.

### Overlay Panels (viewStore.activePanel)
- `history` → HistoryPanel (slide-in from right)
- `export` → ExportPanel
- `guided` → GuidedExplorations

### View Modes (viewStore.mode)
- `2d` — Mafs SVG canvas (default)
- `3d` — Three.js WebGL canvas
- `split` — Side-by-side 2D + 3D

### Grid Types (viewStore.gridType)
- `cartesian` — Standard XY grid (default)
- `polar` — Polar coordinate grid
- `spherical` — Spherical lat/lon grid (3D only)

### Function Categories (28 presets, defined in `engine/presets.ts::getPresets()`)
trigonometric (6) | polynomial (5) | exponential (4) | special (6) | statistical (4) | piecewise (3)

## Key Patterns

### Canvas Full-Height Rendering
Mafs uses SVG viewBox that doesn't auto-stretch. Canvas2D.tsx uses ResizeObserver to measure the container div and passes explicit `height={containerHeight}` to `<Mafs>`.

### Zustand Store Design
Stores use `create<T>((set, get) => ...)`. `functionStore` and `viewStore` are wrapped with the `persist` middleware (`create<T>()(persist(...))`) — `partialize` selects only the durable fields. `viewStore.setActivePanel` toggles (clicking same panel closes it). `functionStore.addFunction` is the single funnel that also calls `historyStore.addEntry`, so every add path (browser, bar, combiner, share-link decode) populates history.

### CSS Variables + Theme
Theme tokens live in `:root[data-theme="dark"]` / `:root[data-theme="light"]` in `index.css`. `App.tsx` writes `document.documentElement.dataset.theme` from `viewStore.theme`. Components reference vars (`--bg-primary`, `--accent`, etc.) via `bg-[var(--bg-primary)]` or inline `style`, so a single attribute flip reskins everything.

### Layout Scroll Zones (the cutoff fix)
The app shell is nested flex. The rule that prevents components clipping each other: **any flex child that should scroll gets `min-h-0 flex-1 overflow-y-auto`, and the scroll lives on that child — not the whole column.** Each sidebar tab body is its own scroll region; the Browse "Custom Expression" `FunctionBar` is a `shrink-0` pinned footer outside the scroll region. `ParamSliders` is `shrink-0 max-h-[42%] overflow-y-auto` so a param-heavy function scrolls internally instead of eating the canvas.

### Hover-Trace (Canvas2D)
A `z-20` capture overlay (`pointer-events:auto`) reads pointer position, maps pixel→math via the **store viewport** (linear, exact because Mafs internal pan/zoom is disabled — store viewport is the single source of truth), evaluates the traced fn, and draws an HTML overlay dot + dropline plus a `name = f(x)` badge. Do NOT rely on Mafs' `useTransformContext` written-during-render into a ref — that proved unreliable.

### Code-Splitting
`Canvas3D`, `HistoryPanel`, `ExportPanel`, `GuidedExplorations` are `React.lazy` in `Layout.tsx`; `AlgebraSteps`/`Properties` (nerdamer) are lazy inside `AlgebraPanel` so the symbolic engine loads only when the panel opens. All wrapped in `<Suspense>`.

## Known Issues & Gotchas

| Issue | Details |
|-------|---------|
| Tailwind v4 HMR cache corruption | Vite's `.vite` cache can corrupt, causing ALL CSS to disappear. **Fix**: Delete `node_modules/.vite` + restart dev server |
| No aggressive global CSS | Adding broad CSS selectors to index.css (e.g., `.MafsView svg { height: 100% !important }`) can break Tailwind v4 processing |
| Mafs React 19 peer dep | mafs 0.21 lists React 16-18 as peer dep — works fine with React 19 but shows npm warning |
| JS bundle | Initial chunk ~1950 kB after splitting Canvas3D (Three.js, ~1064 kB) + panels into lazy chunks. mathjs (~600 kB) stays in main (used by every plot). Further splitting mathjs is the next lever |
| Mafs pan/zoom disabled in 2D | The hover capture overlay intercepts pointer events, so Mafs' built-in pan/zoom is off; the store viewport is authoritative (`resetViewport` exists, but there's no in-canvas pan/zoom control yet) |
| No @types for nerdamer | Custom `.d.ts` in `src/types/nerdamer.d.ts` |
| No @types for react-katex | Custom `.d.ts` in `src/types/react-katex.d.ts` |

## Remaining Work

- **2D viewport controls** — pan/zoom is disabled (overlay captures events); add explicit zoom/pan/zoom-to-fit buttons driving `viewStore` viewport.
- **Editable composed functions** — `FunctionCombiner`/`SnapBlocks`/custom expressions emit `params: []`, so combined results lose their sliders.
- **3D parametric curves** — `ParametricPlot3D` exists but `Canvas3D` only renders the surface; the `Helix (3D)` preset doesn't plot.
- **Further bundle split** — isolate mathjs from the main chunk.
