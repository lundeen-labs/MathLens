import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ViewMode = '2d' | '3d' | 'split';
type GridType = 'cartesian' | 'polar' | 'spherical';
type Theme = 'dark' | 'light';
export type SidebarTab = 'browse' | 'compose' | 'sigma' | 'transform' | 'parametric';
export type ActivePanel = null | 'history' | 'export' | 'guided';

interface ViewStore {
  mode: ViewMode;
  gridType: GridType;
  theme: Theme;

  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;

  cameraPosition: [number, number, number];

  sidebarOpen: boolean;
  algebraPanelOpen: boolean;

  sidebarTab: SidebarTab;
  activePanel: ActivePanel;

  setMode: (mode: ViewMode) => void;
  setGridType: (type: GridType) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setViewport: (xMin: number, xMax: number, yMin: number, yMax: number) => void;
  resetViewport: () => void;
  toggleSidebar: () => void;
  toggleAlgebraPanel: () => void;
  setSidebarTab: (tab: SidebarTab) => void;
  setActivePanel: (panel: ActivePanel) => void;
}

const DEFAULT_VIEWPORT = {
  xMin: -10,
  xMax: 10,
  yMin: -6,
  yMax: 6,
} as const;

export const useViewStore = create<ViewStore>()(
  persist(
    (set) => ({
      mode: '2d',
      gridType: 'cartesian',
      theme: 'dark',

      ...DEFAULT_VIEWPORT,

      cameraPosition: [5, 5, 5],

      sidebarOpen: true,
      algebraPanelOpen: false,

      sidebarTab: 'browse',
      activePanel: null,

      setMode: (mode) =>
        // Spherical grid is 3D-only; fall back to cartesian when leaving 3D.
        set((state) => ({
          mode,
          gridType:
            mode === '2d' && state.gridType === 'spherical'
              ? 'cartesian'
              : state.gridType,
        })),
      setGridType: (gridType) => set({ gridType }),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setViewport: (xMin, xMax, yMin, yMax) => set({ xMin, xMax, yMin, yMax }),
      resetViewport: () => set({ ...DEFAULT_VIEWPORT }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      toggleAlgebraPanel: () =>
        set((state) => ({ algebraPanelOpen: !state.algebraPanelOpen })),
      setSidebarTab: (tab) => set({ sidebarTab: tab }),
      setActivePanel: (panel) =>
        set((state) => ({ activePanel: state.activePanel === panel ? null : panel })),
    }),
    {
      name: 'mathlens-view',
      partialize: (s) => ({
        mode: s.mode,
        gridType: s.gridType,
        theme: s.theme,
        xMin: s.xMin,
        xMax: s.xMax,
        yMin: s.yMin,
        yMax: s.yMax,
        sidebarOpen: s.sidebarOpen,
      }),
    }
  )
);
