import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { InlineMath } from 'react-katex';
import { compile } from 'mathjs';
import { getPresets } from '../engine/presets';
import { useFunctionStore } from '../store/functionStore';
import type { FunctionCategory, FunctionParam } from '../types/function';

// ── Category config ──────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<FunctionCategory, { label: string; icon: string }> = {
  trigonometric: { label: 'Trig', icon: '🌊' },
  polynomial: { label: 'Poly', icon: '📐' },
  exponential: { label: 'Exp', icon: '📈' },
  special: { label: 'Special', icon: '✨' },
  statistical: { label: 'Stats', icon: '📊' },
  piecewise: { label: 'Pieces', icon: '🧩' },
};

const CATEGORIES = Object.keys(CATEGORY_LABELS) as FunctionCategory[];

// Brief one-line descriptions, keyed by the exact preset names in presets.ts.
const DESCRIPTIONS: Record<string, string> = {
  // Trigonometric
  'Sine Wave': 'Classic oscillating wave',
  'Cosine Wave': 'Phase-shifted sinusoid',
  'Tangent': 'Periodic with asymptotes',
  'Sine + Cosine Combo': 'Superposed sinusoids',
  'Damped Oscillation': 'Decaying oscillation',
  'Secant': 'Reciprocal of cosine',
  // Polynomial
  'Linear': 'Straight line',
  'Quadratic': 'Parabolic curve',
  'Cubic': 'S-shaped polynomial',
  'Power Function': 'Variable exponent',
  'Quartic': 'Double-well potential',
  // Exponential
  'Exponential Growth / Decay': 'Rapid growth or decay',
  'Natural Logarithm': 'Slowly increasing curve',
  'Logistic (Sigmoid)': 'S-shaped saturation curve',
  'Exponential Decay with Offset': 'Decays toward an asymptote',
  // Special
  'Absolute Value': 'V-shaped graph',
  'Square Root': 'Half parabola, sideways',
  'Gaussian (Bell Curve)': 'Bell-shaped falloff',
  'Sinc Function': 'Dampened oscillation',
  'Reciprocal (1/x)': 'Hyperbola with asymptotes',
  'Circular / Semicircle': 'Arc of a circle',
  // Statistical
  'Normal Distribution PDF': 'Normal distribution bell',
  'Sigmoid': 'S-shaped logistic curve',
  'Laplace Distribution': 'Sharp-peaked distribution',
  'Log-Normal PDF Approx': 'Right-skewed distribution',
  // Piecewise
  'Step Function (tanh approx)': 'Smooth discontinuous jump',
  'Smooth Ramp': 'Soft ReLU-style bend',
  'Bump Function': 'Compact-support hump',
};

// ── Thumbnail component ──────────────────────────────────────────────────────

function FunctionThumbnail({
  expression,
  params,
}: {
  expression: string;
  params: FunctionParam[];
}) {
  const pathData = useMemo(() => {
    try {
      const compiled = compile(expression);
      const scope: Record<string, number> = {};
      for (const p of params) scope[p.name] = p.value;

      const segments: string[] = [];
      const steps = 48;
      const xSpan = 6; // -3 to 3
      let needsMove = true;

      for (let i = 0; i <= steps; i++) {
        const x = -3 + (xSpan * i) / steps;
        scope.x = x;
        let y: number;
        try {
          y = compiled.evaluate({ ...scope }) as number;
        } catch {
          needsMove = true;
          continue;
        }
        if (typeof y !== 'number' || !isFinite(y) || Math.abs(y) > 50) {
          needsMove = true;
          continue;
        }
        const clamped = Math.max(-3, Math.min(3, y));
        const svgX = ((x + 3) / xSpan) * 80;
        const svgY = 40 - ((clamped + 3) / xSpan) * 40;
        segments.push(
          `${needsMove ? 'M' : 'L'} ${svgX.toFixed(1)} ${svgY.toFixed(1)}`,
        );
        needsMove = false;
      }
      return segments.join(' ');
    } catch {
      return '';
    }
  }, [expression, params]);

  return (
    <svg
      viewBox="0 0 80 40"
      className="h-10 w-full"
      preserveAspectRatio="none"
    >
      <line
        x1="0" y1="20" x2="80" y2="20"
        stroke="var(--border)" strokeWidth="0.5" opacity="0.4"
      />
      <line
        x1="40" y1="0" x2="40" y2="40"
        stroke="var(--border)" strokeWidth="0.5" opacity="0.4"
      />
      {pathData && (
        <path
          d={pathData}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.85"
        />
      )}
    </svg>
  );
}

// ── Category tab ─────────────────────────────────────────────────────────────

function CategoryTab({
  category,
  isActive,
  onClick,
}: {
  category: FunctionCategory;
  isActive: boolean;
  onClick: () => void;
}) {
  const { label, icon } = CATEGORY_LABELS[category];
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="rounded-md px-2 py-1 text-[11px] font-medium transition-colors duration-150"
      style={{
        background: isActive ? 'var(--accent)' : 'var(--bg-tertiary)',
        color: isActive ? '#fff' : 'var(--text-secondary)',
        border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
      }}
    >
      {icon} {label}
    </motion.button>
  );
}

// ── Function card ────────────────────────────────────────────────────────────

function FunctionCard({
  preset,
  onAdd,
}: {
  preset: { name: string; expression: string; latex: string; params: FunctionParam[] };
  onAdd: () => void;
}) {
  const description = DESCRIPTIONS[preset.name] ?? '';

  return (
    <motion.button
      whileHover={{
        scale: 1.03,
        boxShadow: '0 0 18px rgba(99, 102, 241, 0.25)',
      }}
      whileTap={{ scale: 0.96, opacity: 0.85 }}
      transition={{ type: 'spring', damping: 25, stiffness: 400 }}
      onClick={onAdd}
      className="flex flex-col gap-1.5 rounded-lg p-2.5 text-left transition-colors"
      style={{
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border)',
      }}
    >
      {/* SVG thumbnail */}
      <div
        className="w-full overflow-hidden rounded"
        style={{ background: 'var(--bg-primary)' }}
      >
        <FunctionThumbnail
          expression={preset.expression}
          params={preset.params}
        />
      </div>

      {/* Function name */}
      <span
        className="text-[11px] font-semibold leading-tight"
        style={{ color: 'var(--text-primary)' }}
      >
        {preset.name}
      </span>

      {/* LaTeX expression */}
      <span
        className="katex-card truncate text-[10px] leading-tight"
        style={{ color: 'var(--text-secondary)' }}
      >
        <InlineMath math={preset.latex} />
      </span>

      {/* Brief description */}
      {description && (
        <span
          className="text-[9px] leading-tight"
          style={{ color: 'var(--text-muted)' }}
        >
          {description}
        </span>
      )}
    </motion.button>
  );
}

// ── Main FunctionBrowser ─────────────────────────────────────────────────────

export default function FunctionBrowser() {
  const [activeCategory, setActiveCategory] =
    useState<FunctionCategory>('trigonometric');
  const addFunction = useFunctionStore((s) => s.addFunction);
  const presets = useMemo(() => getPresets(), []);

  const categoryPresets = presets[activeCategory] ?? [];

  const handleAdd = (preset: (typeof categoryPresets)[number]) => {
    addFunction({
      name: preset.name,
      expression: preset.expression,
      params: preset.params.map((p) => ({ ...p })),
      category: preset.category,
      latex: preset.latex,
      dimension: preset.dimension,
    });
  };

  return (
    <div className="flex flex-col px-3 py-3">
      <h2
        className="mb-2 text-xs font-semibold uppercase tracking-wider"
        style={{ color: 'var(--text-secondary)' }}
      >
        Functions
      </h2>

      {/* Category tabs */}
      <div className="mb-3 flex flex-wrap gap-1">
        {CATEGORIES.map((cat) => (
          <CategoryTab
            key={cat}
            category={cat}
            isActive={activeCategory === cat}
            onClick={() => setActiveCategory(cat)}
          />
        ))}
      </div>

      {/* Function cards — 2 column grid */}
      <div className="grid grid-cols-2 gap-2">
        {categoryPresets.map((preset, i) => (
          <FunctionCard
            key={`${activeCategory}-${i}`}
            preset={preset}
            onAdd={() => handleAdd(preset)}
          />
        ))}
      </div>
    </div>
  );
}
