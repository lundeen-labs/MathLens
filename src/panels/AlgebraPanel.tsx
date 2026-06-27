import { Suspense, lazy, useState } from 'react';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useFunctionStore } from '../store/functionStore';
import { useViewStore } from '../store/viewStore';

// Both pull in the symbolic engine (nerdamer); load it only when the
// algebra panel is actually opened.
const AlgebraSteps = lazy(() => import('./AlgebraSteps'));
const Properties = lazy(() => import('./Properties'));

type Tab = 'steps' | 'properties';

export default function AlgebraPanel() {
  const algebraPanelOpen = useViewStore((s) => s.algebraPanelOpen);
  const toggleAlgebraPanel = useViewStore((s) => s.toggleAlgebraPanel);
  const selectedFn = useFunctionStore((s) =>
    s.functions.find((f) => f.id === s.selectedId),
  );
  const [activeTab, setActiveTab] = useState<Tab>('steps');

  return (
    <AnimatePresence>
      {algebraPanelOpen && (
        <motion.aside
          initial={{ x: 350, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 350, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="flex w-[350px] shrink-0 flex-col overflow-hidden"
          style={{
            background: 'var(--bg-secondary)',
            borderLeft: '1px solid var(--border)',
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-3 py-2.5"
               style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex-1 min-w-0">
              {selectedFn ? (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: selectedFn.color }} />
                  <span className="truncate text-sm font-medium"
                        style={{ color: 'var(--text-primary)' }}>
                    {selectedFn.name}
                  </span>
                  <span className="truncate text-xs" style={{ color: 'var(--text-muted)' }}>
                    <InlineMath math={selectedFn.latex || selectedFn.expression} />
                  </span>
                </div>
              ) : (
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  No function selected
                </span>
              )}
            </div>

            <button
              onClick={toggleAlgebraPanel}
              className="shrink-0 rounded p-1 transition-colors duration-200 hover:bg-white/10"
              style={{ color: 'var(--text-muted)' }}
              title="Close panel"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 1l12 12M13 1L1 13" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex px-3 pt-2 gap-1"
               style={{ borderBottom: '1px solid var(--border)' }}>
            {(['steps', 'properties'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="relative px-3 py-2 text-xs font-medium capitalize transition-colors duration-200"
                style={{
                  color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div
                    layoutId="algebra-tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ background: 'var(--accent)' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <Suspense fallback={null}>
              <AnimatePresence mode="wait">
                {activeTab === 'steps' ? (
                  <motion.div
                    key="steps"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AlgebraSteps />
                  </motion.div>
                ) : (
                  <motion.div
                    key="properties"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Properties />
                  </motion.div>
                )}
              </AnimatePresence>
            </Suspense>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
