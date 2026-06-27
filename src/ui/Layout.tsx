import { Suspense, lazy, useEffect, useRef } from 'react';
import { useViewStore } from '../store/viewStore';
import type { SidebarTab } from '../store/viewStore';
import { motion, AnimatePresence } from 'framer-motion';
import FunctionBrowser from '../composer/FunctionBrowser';
import FunctionList from '../composer/FunctionList';
import FunctionBar from '../composer/FunctionBar';
import SnapBlocks from '../composer/SnapBlocks';
import FunctionCombiner from '../composer/FunctionCombiner';
import SigmaNotation from '../composer/SigmaNotation';
import TransformControls from '../composer/TransformControls';
import ParametricAnimator from '../composer/ParametricAnimator';
import Canvas2D from '../canvas/Canvas2D';
import ParamSliders from '../composer/ParamSliders';
import AlgebraPanel from '../panels/AlgebraPanel';
import Toolbar from '../ui/Toolbar';

// Heavy / on-demand chunks — split out of the initial bundle.
const Canvas3D = lazy(() => import('../canvas/Canvas3D'));
const HistoryPanel = lazy(() => import('../ui/HistoryPanel'));
const ExportPanel = lazy(() => import('../ui/ExportPanel'));
const GuidedExplorations = lazy(() => import('../ui/GuidedExplorations'));

const SIDEBAR_TABS: { key: SidebarTab; label: string }[] = [
  { key: 'browse', label: 'Browse' },
  { key: 'compose', label: 'Compose' },
  { key: 'sigma', label: 'Σ' },
  { key: 'transform', label: 'Transform' },
  { key: 'parametric', label: 'P(t)' },
];

// ── Loading fallback for lazy chunks ─────────────────────────────────────────

function ChunkFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div
        className="h-6 w-6 animate-spin rounded-full border-2"
        style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }}
      />
    </div>
  );
}

// ── Sidebar edge toggle (visible when sidebar is open) ───────────────────────

function SidebarEdgeToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute -right-3 top-1/2 z-30 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border transition-colors duration-150 hover:bg-white/10"
      style={{
        background: 'var(--bg-secondary)',
        borderColor: 'var(--border)',
      }}
      title="Collapse sidebar"
    >
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ color: 'var(--text-muted)' }}
      >
        <path d="M6 2L3 5L6 8" />
      </svg>
    </button>
  );
}

// ── Main Layout ──────────────────────────────────────────────────────────────

export default function Layout() {
  const sidebarOpen = useViewStore((s) => s.sidebarOpen);
  const toggleSidebar = useViewStore((s) => s.toggleSidebar);
  const mode = useViewStore((s) => s.mode);
  const sidebarTab = useViewStore((s) => s.sidebarTab);
  const setSidebarTab = useViewStore((s) => s.setSidebarTab);
  const activePanel = useViewStore((s) => s.activePanel);
  const setActivePanel = useViewStore((s) => s.setActivePanel);
  const algebraPanelOpen = useViewStore((s) => s.algebraPanelOpen);
  const toggleAlgebraPanel = useViewStore((s) => s.toggleAlgebraPanel);

  const overlayRef = useRef<HTMLDivElement>(null);

  // Esc closes whichever panel is open; focus the overlay when it opens.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (activePanel) setActivePanel(null);
      else if (algebraPanelOpen) toggleAlgebraPanel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activePanel, algebraPanelOpen, setActivePanel, toggleAlgebraPanel]);

  useEffect(() => {
    if (activePanel) overlayRef.current?.focus();
  }, [activePanel]);

  return (
    <div
      className="flex h-screen w-screen flex-col overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Top toolbar */}
      <Toolbar />

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR — 320px, collapsible with animation */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="relative flex shrink-0 flex-col overflow-hidden"
              style={{
                background: 'var(--bg-secondary)',
                borderRight: '1px solid var(--border)',
              }}
            >
              <div className="flex min-w-[320px] flex-1 flex-col overflow-hidden">
                {/* Sidebar tab bar */}
                <div
                  role="tablist"
                  aria-label="Sidebar tools"
                  className="flex shrink-0 items-center gap-1 px-2 py-1.5"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  {SIDEBAR_TABS.map(({ key, label }) => (
                    <button
                      key={key}
                      role="tab"
                      aria-selected={sidebarTab === key}
                      onClick={() => setSidebarTab(key)}
                      className="rounded-full px-2.5 py-1 text-[11px] font-medium transition-all"
                      style={{
                        background:
                          sidebarTab === key ? 'var(--accent)' : 'transparent',
                        color: sidebarTab === key ? '#fff' : 'var(--text-muted)',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Tab content — each tab owns its own scroll region so
                    nothing clips or buries sibling controls. */}
                <div className="flex min-h-0 flex-1 flex-col">
                  {sidebarTab === 'browse' && (
                    <>
                      {/* Cards + active list scroll together… */}
                      <div className="min-h-0 flex-1 overflow-y-auto">
                        <FunctionBrowser />
                        <div
                          className="mx-3 my-1"
                          style={{ borderTop: '1px solid var(--border)' }}
                        />
                        <FunctionList />
                      </div>
                      {/* …while the custom-expression bar stays pinned. */}
                      <div className="shrink-0">
                        <FunctionBar />
                      </div>
                    </>
                  )}
                  {sidebarTab === 'compose' && (
                    <div className="min-h-0 flex-1 overflow-y-auto">
                      <SnapBlocks />
                      <div
                        className="mx-3 my-1"
                        style={{ borderTop: '1px solid var(--border)' }}
                      />
                      <FunctionCombiner />
                    </div>
                  )}
                  {sidebarTab === 'sigma' && (
                    <div className="min-h-0 flex-1 overflow-y-auto">
                      <SigmaNotation />
                    </div>
                  )}
                  {sidebarTab === 'transform' && (
                    <div className="min-h-0 flex-1 overflow-y-auto">
                      <TransformControls />
                    </div>
                  )}
                  {sidebarTab === 'parametric' && (
                    <div className="min-h-0 flex-1 overflow-y-auto">
                      <ParametricAnimator />
                    </div>
                  )}
                </div>
              </div>

              {/* Edge toggle button */}
              <SidebarEdgeToggle onClick={toggleSidebar} />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Collapsed sidebar — narrow strip with expand chevron */}
        {!sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="flex w-8 shrink-0 items-center justify-center transition-colors duration-150 hover:bg-white/5"
            style={{
              background: 'var(--bg-secondary)',
              borderRight: '1px solid var(--border)',
            }}
            title="Open sidebar"
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: 'var(--text-muted)' }}
            >
              <path d="M4 2L7 5L4 8" />
            </svg>
          </button>
        )}

        {/* CENTER — Canvas + ParamSliders at bottom */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 overflow-hidden">
            {(mode === '2d' || mode === 'split') && (
              <div className={`h-full ${mode === 'split' ? 'w-1/2' : 'w-full'}`}>
                <Canvas2D />
              </div>
            )}
            {(mode === '3d' || mode === 'split') && (
              <div className={`h-full ${mode === 'split' ? 'w-1/2' : 'w-full'}`}>
                <Suspense fallback={<ChunkFallback />}>
                  <Canvas3D />
                </Suspense>
              </div>
            )}
          </div>
          <ParamSliders />
        </main>

        {/* RIGHT PANEL — AlgebraPanel manages its own aside + AnimatePresence */}
        <AlgebraPanel />
      </div>

      {/* OVERLAY PANELS */}
      <AnimatePresence>
        {activePanel && (
          <>
            {/* Backdrop */}
            <motion.div
              key="overlay-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.45)' }}
              onClick={() => setActivePanel(null)}
            />
            {/* Slide-in panel */}
            <motion.div
              key="overlay-panel"
              ref={overlayRef}
              role="dialog"
              aria-modal="true"
              aria-label={`${activePanel} panel`}
              tabIndex={-1}
              initial={{ x: 380, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 380, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 z-50 flex h-full w-[360px] flex-col outline-none"
              style={{
                background: 'var(--bg-secondary)',
                borderLeft: '1px solid var(--border)',
                boxShadow: '-8px 0 30px rgba(0,0,0,0.3)',
              }}
            >
              {/* Close button */}
              <button
                onClick={() => setActivePanel(null)}
                aria-label="Close panel"
                className="absolute right-2 top-2 z-10 rounded-md p-1.5 transition-colors hover:bg-white/10"
                style={{ color: 'var(--text-muted)' }}
                title="Close (Esc)"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <path d="M2 2l10 10M12 2L2 12" />
                </svg>
              </button>

              <Suspense fallback={<ChunkFallback />}>
                {activePanel === 'history' && <HistoryPanel />}
                {activePanel === 'export' && <ExportPanel />}
                {activePanel === 'guided' && <GuidedExplorations />}
              </Suspense>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
