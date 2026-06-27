# MathLens

Interactive math visualization for visual learners. Browse preset functions, click to plot, and drag sliders to see real-time changes. No equation typing required, everything is point-and-click.

Repository: https://github.com/lundeen-labs/MathLens

## Features

- 28 preset functions across 6 categories (trigonometric, polynomial, exponential, special, statistical, piecewise). Click a card to plot instantly.
- Real-time parameter sliders (amplitude, frequency, phase, etc.) with live graph updates.
- Function composition via drag-and-drop blocks: f+g, f∘g, f×g.
- Sigma (Σ) explorer: 6 series types with animated bar charts, partial sums, and convergence.
- Transform controls: shift, scale, and reflection with instant LaTeX preview.
- 2D / 3D / split view: Mafs for 2D SVG plots, Three.js for 3D WebGL, or side-by-side.
- Grid types: Cartesian, polar, and spherical (spherical is 3D only).
- Parametric curves with trace dots (presets such as Lissajous, spirals, roses, butterfly).
- Light / dark theme toggle, persisted to localStorage.
- Hover readout: hover the 2D canvas to snap a marker onto the curve with a live `name = f(x)` value.
- Plot and view persistence (zustand `persist`); active functions and view survive a refresh.
- Share links: "Export & Share" encodes active functions into a `?functions=` URL that restores them on load.
- Expression history and export as SVG / PNG / LaTeX.
- Guided explorations: step-by-step walkthroughs for discovering concepts visually.

## Tech Stack

| Layer        | Technology                                                        |
|--------------|-------------------------------------------------------------------|
| Framework    | React 19.2 + TypeScript 5.9 + Vite 8.0                            |
| Styling      | Tailwind CSS v4.2 (`@tailwindcss/vite` plugin)                    |
| 2D plotting  | Mafs 0.21 (SVG-based math plots)                                  |
| 3D plotting  | Three.js 0.183 via @react-three/fiber 9 + @react-three/drei 10   |
| Math engine  | mathjs 15 (parse/eval) + nerdamer 1.1 (symbolic)                 |
| LaTeX        | KaTeX 0.16 via react-katex 3                                      |
| State        | Zustand 5 (5 stores; functionStore + viewStore persist to localStorage) |
| Animation    | framer-motion 12                                                  |
| UI primitives| Radix UI (dialog, popover, slider, tabs, tooltip)                |
| Lint         | ESLint 9 (flat config) + typescript-eslint 8                     |

## Project Structure

```
MathLens/
├── index.html              # Vite HTML entry
├── vite.config.ts          # Vite config (react + tailwindcss plugins)
├── eslint.config.js        # ESLint flat config
├── tsconfig*.json          # Project references (app + node)
├── docs/screenshots/       # Screenshot assets
├── public/                 # Static assets (favicon, etc.)
└── src/
    ├── App.tsx             # Root: applies theme to <html>, decodes ?functions= share links on mount
    ├── main.tsx            # React entry point
    ├── index.css           # Theme CSS vars (dark/light), Tailwind v4 import, Mafs overrides
    ├── canvas/             # 2D (Mafs) + 3D (Three.js) rendering, parametric plots, grids, controls
    ├── composer/           # Function browser, list, bar, sliders, combiner, snap blocks, sigma, transforms, parametric
    ├── engine/             # evaluator.ts, parser.ts, presets.ts (28 presets), symbolic.ts (nerdamer)
    ├── store/              # Zustand stores: functionStore, viewStore, animStore, historyStore, parametricStore
    ├── ui/                 # Layout, Toolbar, HistoryPanel, ExportPanel, GuidedExplorations
    ├── panels/             # AlgebraPanel, AlgebraSteps, AnimationControls, Properties
    ├── animations/         # fourier.ts, morph.ts, trace.ts, useAnimation.ts
    └── types/              # function.ts + declaration stubs (nerdamer.d.ts, react-katex.d.ts)
```

Each `src/` domain directory carries its own `README.md`.

## Getting Started

Requires Node.js (>= 20.19) and npm.

```bash
git clone https://github.com/lundeen-labs/MathLens.git
cd MathLens
npm install
npm run dev        # Dev server at http://localhost:5173
```

### Scripts

| Command           | Action                                              |
|-------------------|-----------------------------------------------------|
| `npm run dev`     | Start the Vite dev server (http://localhost:5173)   |
| `npm run build`   | Type-check (`tsc -b`) then build for production      |
| `npm run preview` | Serve the production build locally                  |
| `npm run lint`    | Run ESLint over the project                         |

There is no test runner configured in this project.

## Environment Variables

None. The app is fully client-side with no backend, API keys, or environment configuration.

## Architecture Notes

- Data flow: clicking a preset card calls `functionStore.addFunction()`; `Canvas2D` subscribes to `functionStore`, `engine/evaluator.ts` compiles the expression with math.js, and points render via Mafs `<Plot.OfX>`. Slider changes call `functionStore.updateParam()`, triggering re-evaluation and re-render.
- Sidebar tabs (`viewStore.sidebarTab`): `browse`, `compose`, `sigma`, `transform`, `parametric`.
- View modes (`viewStore.mode`): `2d` (default), `3d`, `split`. Grid types (`viewStore.gridType`): `cartesian` (default), `polar`, `spherical` (3D only).
- `functionStore.addFunction` is the single funnel that also calls `historyStore.addEntry`, so every add path (browser, bar, combiner, share-link decode) populates history.
- Theme tokens live in `:root[data-theme="dark"]` / `:root[data-theme="light"]` in `index.css`; `App.tsx` writes `document.documentElement.dataset.theme` from `viewStore.theme`.
- Code-splitting: `Canvas3D` (Three.js), the overlay panels, and the nerdamer algebra path are `React.lazy`, keeping the initial chunk around 1950 kB.

## Status and Known Issues

Working application, actively developed (last substantial pass 2026-05-28).

- Initial JS chunk is ~1950 kB after splitting out Canvas3D and panels; mathjs (~600 kB) stays in the main chunk. Further isolating mathjs is the next bundle lever.
- 2D pan/zoom is disabled because the hover-trace capture overlay intercepts pointer events; the store viewport is authoritative. Explicit zoom/pan/zoom-to-fit controls are not yet implemented.
- Composed functions (`FunctionCombiner` / `SnapBlocks` / custom expressions) emit `params: []`, so combined results lose their sliders.
- `ParametricPlot3D` exists but `Canvas3D` only renders surfaces, so the `Helix (3D)` parametric preset does not yet plot.
- Tailwind v4 HMR: Vite's `node_modules/.vite` cache can corrupt and drop all CSS. Fix by deleting the cache and restarting the dev server.
- nerdamer and react-katex ship no `@types`; local declaration stubs live in `src/types/`.

## License

The package is marked `private`. No license file is present in the repository.
