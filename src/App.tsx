import { useEffect } from 'react';
import Layout from './ui/Layout';
import { useViewStore } from './store/viewStore';
import { useFunctionStore } from './store/functionStore';
import type { FunctionCategory, FunctionParam } from './types/function';

interface SharedConfig {
  name: string;
  expression: string;
  latex: string;
  category: FunctionCategory;
  dimension: '2d' | '3d';
  params: FunctionParam[];
}

/** Restore functions from a `?functions=` share link, if present. */
function loadFromShareLink() {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('functions');
  if (!encoded) return;

  try {
    const configs = JSON.parse(decodeURIComponent(atob(encoded))) as SharedConfig[];
    if (!Array.isArray(configs) || configs.length === 0) return;

    const { clearAll, addFunction } = useFunctionStore.getState();
    clearAll();
    for (const cfg of configs) {
      if (!cfg.expression) continue;
      addFunction({
        name: cfg.name ?? 'Shared Function',
        expression: cfg.expression,
        latex: cfg.latex ?? cfg.expression,
        category: cfg.category ?? 'polynomial',
        dimension: cfg.dimension === '3d' ? '3d' : '2d',
        params: Array.isArray(cfg.params) ? cfg.params : [],
      });
    }
  } catch {
    // Malformed link — ignore and keep whatever was persisted.
    return;
  }

  // Strip the param so a refresh doesn't re-import over later edits.
  const url = new URL(window.location.href);
  url.searchParams.delete('functions');
  window.history.replaceState({}, '', url.toString());
}

export default function App() {
  const theme = useViewStore((s) => s.theme);

  // Apply theme to the document root for CSS-var switching.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // One-time share-link import on mount (overrides persisted plot).
  useEffect(() => {
    loadFromShareLink();
  }, []);

  return <Layout />;
}
