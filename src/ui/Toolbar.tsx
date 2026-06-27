import { motion } from 'framer-motion';
import { useViewStore } from '../store/viewStore';
import type { ActivePanel } from '../store/viewStore';

type ViewMode = '2d' | '3d' | 'split';

const VIEW_MODES: { key: ViewMode; label: string }[] = [
  { key: '2d', label: '2D' },
  { key: '3d', label: '3D' },
  { key: 'split', label: 'Split' },
];

export default function Toolbar() {
  const mode = useViewStore((s) => s.mode);
  const setMode = useViewStore((s) => s.setMode);
  const gridType = useViewStore((s) => s.gridType);
  const setGridType = useViewStore((s) => s.setGridType);
  const theme = useViewStore((s) => s.theme);
  const toggleTheme = useViewStore((s) => s.toggleTheme);
  const algebraPanelOpen = useViewStore((s) => s.algebraPanelOpen);
  const toggleAlgebraPanel = useViewStore((s) => s.toggleAlgebraPanel);
  const toggleSidebar = useViewStore((s) => s.toggleSidebar);
  const sidebarOpen = useViewStore((s) => s.sidebarOpen);
  const activePanel = useViewStore((s) => s.activePanel);
  const setActivePanel = useViewStore((s) => s.setActivePanel);

  return (
    <div
      className="flex h-12 shrink-0 items-center px-3 gap-3"
      style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Left: Logo + sidebar toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleSidebar}
          className="rounded p-1.5 transition-colors duration-200 hover:bg-white/10"
          style={{ color: 'var(--text-secondary)' }}
          title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M2 4h12M2 8h12M2 12h12" />
          </svg>
        </button>
        <span className="text-sm font-bold tracking-tight select-none" style={{ color: 'var(--accent)' }}>
          Math<span style={{ color: 'var(--text-primary)' }}>Lens</span>
        </span>
      </div>

      {/* Center: View mode buttons */}
      <div className="flex flex-1 items-center justify-center">
        <div className="flex gap-0.5 rounded-lg p-0.5" style={{ background: 'var(--bg-tertiary)' }}>
          {VIEW_MODES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              aria-pressed={mode === key}
              aria-label={`${label} view`}
              className="relative rounded-md px-4 py-1 text-xs font-medium transition-colors duration-200"
              style={{
                color: mode === key ? '#fff' : 'var(--text-muted)',
              }}
            >
              {mode === key && (
                <motion.div
                  layoutId="toolbar-view-mode"
                  className="absolute inset-0 rounded-md"
                  style={{ background: 'var(--accent)' }}
                  transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                />
              )}
              <span className="relative z-10">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Grid toggle, Algebra panel, Settings */}
      <div className="flex items-center gap-1">
        {/* Grid type cycle. Spherical is 3D-only, so 2D cycles cartesian ↔ polar. */}
        <button
          onClick={() => {
            const cycle: Array<'cartesian' | 'polar' | 'spherical'> =
              mode === '2d'
                ? ['cartesian', 'polar']
                : ['cartesian', 'polar', 'spherical'];
            const idx = cycle.indexOf(gridType);
            setGridType(cycle[(idx + 1) % cycle.length]);
          }}
          className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs transition-colors duration-200 hover:bg-white/10"
          style={{ color: 'var(--text-secondary)' }}
          title={`Grid: ${gridType} (click to cycle)`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
            {gridType === 'cartesian' ? (
              // Cartesian grid icon
              <>
                <path d="M7 1v12M1 7h12" />
                <path d="M1 1v12h12" opacity="0.3" />
              </>
            ) : gridType === 'polar' ? (
              // Polar grid icon
              <>
                <circle cx="7" cy="7" r="3" />
                <circle cx="7" cy="7" r="6" />
                <path d="M7 1v12M1 7h12" />
              </>
            ) : (
              // Spherical grid icon
              <>
                <circle cx="7" cy="7" r="6" />
                <ellipse cx="7" cy="7" rx="3" ry="6" />
                <path d="M1 7h12" />
              </>
            )}
          </svg>
          <span className="hidden sm:inline">
            {gridType === 'cartesian' ? 'XY' : gridType === 'polar' ? 'Polar' : 'Sphere'}
          </span>
        </button>

        {/* Divider */}
        <div className="mx-1 h-5 w-px" style={{ background: 'var(--border)' }} />

        {/* History panel toggle */}
        <PanelToggle
          panel="history"
          activePanel={activePanel}
          setActivePanel={setActivePanel}
          title="History"
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />

        {/* Export panel toggle */}
        <PanelToggle
          panel="export"
          activePanel={activePanel}
          setActivePanel={setActivePanel}
          title="Export & Share"
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          }
        />

        {/* Guided explorations toggle */}
        <PanelToggle
          panel="guided"
          activePanel={activePanel}
          setActivePanel={setActivePanel}
          title="Guided Explorations"
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
          }
        />

        {/* Divider */}
        <div className="mx-1 h-5 w-px" style={{ background: 'var(--border)' }} />

        {/* Algebra panel toggle */}
        <button
          onClick={toggleAlgebraPanel}
          aria-pressed={algebraPanelOpen}
          className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs transition-colors duration-200"
          style={{
            background: algebraPanelOpen ? 'var(--accent)' : 'transparent',
            color: algebraPanelOpen ? '#fff' : 'var(--text-secondary)',
          }}
          title={algebraPanelOpen ? 'Hide algebra panel' : 'Show algebra panel'}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M2 2h4v4H2zM8 2h4v4H8zM2 8h4v4H2zM8 8h4v4H8z" />
          </svg>
          <span className="hidden sm:inline">Algebra</span>
        </button>

        {/* Theme toggle (light / dark) */}
        <button
          onClick={toggleTheme}
          className="rounded-md p-1.5 transition-colors duration-200 hover:bg-white/10"
          style={{ color: 'var(--text-secondary)' }}
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {theme === 'dark' ? (
            // Sun — click for light
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="8" r="3" />
              <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M2.9 2.9l1.1 1.1M12 12l1.1 1.1M2.9 13.1l1.1-1.1M12 4l1.1-1.1" />
            </svg>
          ) : (
            // Moon — click for dark
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

function PanelToggle({
  panel,
  activePanel,
  setActivePanel,
  title,
  icon,
}: {
  panel: ActivePanel;
  activePanel: ActivePanel;
  setActivePanel: (p: ActivePanel) => void;
  title: string;
  icon: React.ReactNode;
}) {
  const isActive = activePanel === panel;
  return (
    <button
      onClick={() => setActivePanel(panel)}
      aria-pressed={isActive}
      className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs transition-colors duration-200"
      style={{
        background: isActive ? 'var(--accent)' : 'transparent',
        color: isActive ? '#fff' : 'var(--text-secondary)',
      }}
      title={title}
    >
      {icon}
      <span className="hidden sm:inline">{title}</span>
    </button>
  );
}
