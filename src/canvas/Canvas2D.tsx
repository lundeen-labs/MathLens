import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { Mafs, Coordinates, Plot } from 'mafs';
import { compile } from 'mathjs';
import { useFunctionStore } from '../store/functionStore';
import { useViewStore } from '../store/viewStore';
import { useParametricStore } from '../store/parametricStore';
import { useAnimStore } from '../store/animStore';
import ParametricPlot2D from './ParametricPlot2D';
import PolarGrid from './grids/PolarGrid';
import type { MathFunction } from '../types/function';

/**
 * Compile once per expression, then evaluate cheaply per x.
 * Param values are snapshotted into the scope so Mafs can
 * call the returned function thousands of times per frame.
 *
 * `yRange` lets us break the line across asymptotes: any value whose
 * magnitude blows far past the visible window is returned as NaN, so
 * Mafs lifts the pen instead of drawing a vertical streak through
 * tan / sec / 1/x discontinuities.
 */
function makeEvaluator(fn: MathFunction, yRange: number) {
  const limit = Math.max(1e4, yRange * 200);
  try {
    const compiled = compile(fn.expression);
    const baseScope: Record<string, number> = {};
    fn.params.forEach((p) => {
      baseScope[p.name] = p.value;
    });
    return (x: number): number => {
      baseScope.x = x;
      try {
        const result = compiled.evaluate(baseScope);
        if (typeof result !== 'number' || !isFinite(result)) return NaN;
        return Math.abs(result) > limit ? NaN : result;
      } catch {
        return NaN;
      }
    };
  } catch {
    return () => NaN;
  }
}

const fmt = (n: number) => parseFloat(n.toFixed(3));

// ── Main Canvas2D ────────────────────────────────────────────────────────────

export default function Canvas2D() {
  const functions = useFunctionStore((s) => s.functions);
  const selectedId = useFunctionStore((s) => s.selectedId);
  const xMin = useViewStore((s) => s.xMin);
  const xMax = useViewStore((s) => s.xMax);
  const yMin = useViewStore((s) => s.yMin);
  const yMax = useViewStore((s) => s.yMax);

  // Parametric state
  const parametricCurves = useParametricStore((s) => s.curves);
  const animProgress = useAnimStore((s) => s.progress);
  const animationType = useAnimStore((s) => s.animationType);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(600);

  // Hover position in math coordinates (null when pointer is off-canvas).
  const [hover, setHover] = useState<{ mx: number; my: number } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const h = entry.contentRect.height;
        if (h > 0) setContainerHeight(h);
      }
    });
    ro.observe(el);
    if (el.clientHeight > 0) setContainerHeight(el.clientHeight);
    return () => ro.disconnect();
  }, []);

  const yRange = yMax - yMin;

  // Build evaluators — recomputed when any function/param or range changes
  const evaluators = useMemo(() => {
    const map = new Map<string, (x: number) => number>();
    functions.forEach((fn) => {
      if (fn.visible && fn.dimension === '2d') {
        map.set(fn.id, makeEvaluator(fn, yRange));
      }
    });
    return map;
  }, [functions, yRange]);

  const visibleFns = useMemo(
    () => functions.filter((fn) => fn.visible && fn.dimension === '2d'),
    [functions],
  );

  // The function the hover-trace snaps to: selected if visible, else first.
  const tracedFn = useMemo(() => {
    const sel = visibleFns.find((f) => f.id === selectedId);
    return sel ?? visibleFns[0] ?? null;
  }, [visibleFns, selectedId]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const fx = (e.clientX - rect.left) / rect.width;
      const fy = (e.clientY - rect.top) / rect.height;
      setHover({
        mx: xMin + fx * (xMax - xMin),
        my: yMax - fy * (yMax - yMin),
      });
    },
    [xMin, xMax, yMin, yMax],
  );

  const handleMouseLeave = useCallback(() => setHover(null), []);

  const traceY =
    hover && tracedFn ? evaluators.get(tracedFn.id)?.(hover.mx) ?? null : null;
  const traceColor = tracedFn ? tracedFn.color : 'var(--text-primary)';

  // Pixel-percent positions for the overlay marker (store viewport mapping).
  const toLeftPct = (x: number) => ((x - xMin) / (xMax - xMin)) * 100;
  const toTopPct = (y: number) => ((yMax - y) / (yMax - yMin)) * 100;
  const showMarker =
    hover != null &&
    tracedFn != null &&
    traceY != null &&
    isFinite(traceY) &&
    traceY >= yMin &&
    traceY <= yMax;

  // 2D parametric curves (no zExpr)
  const parametric2D = useMemo(
    () => parametricCurves.filter((c) => !c.zExpr),
    [parametricCurves],
  );
  const isParametricMode = animationType === 'parametric';

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      {/* Mafs canvas — fills container */}
      <Mafs
        viewBox={{ x: [xMin, xMax], y: [yMin, yMax] }}
        preserveAspectRatio={false}
        height={containerHeight}
      >
        <Coordinates.Cartesian
          xAxis={{
            lines: 1,
            labels: (n) => (Number.isInteger(n) ? String(n) : ''),
          }}
          yAxis={{
            lines: 1,
            labels: (n) => (Number.isInteger(n) ? String(n) : ''),
          }}
        />

        {/* Polar overlay (self-guards on gridType === 'polar') */}
        <PolarGrid />

        {visibleFns.map((fn) => {
          const evaluate = evaluators.get(fn.id);
          if (!evaluate) return null;
          const isSelected = fn.id === selectedId;
          return (
            <Plot.OfX
              key={fn.id}
              y={evaluate}
              color={fn.color}
              weight={isSelected ? 3.5 : 2}
              opacity={isSelected ? 1 : 0.75}
            />
          );
        })}

        {/* Parametric curves */}
        {parametric2D.map((curve) => {
          const paramRecord: Record<string, number> = {};
          curve.params.forEach((p) => {
            paramRecord[p.name] = p.value;
          });

          return (
            <ParametricPlot2D
              key={curve.id}
              xExpr={curve.xExpr}
              yExpr={curve.yExpr}
              tRange={[curve.tMin, curve.tMax]}
              params={paramRecord}
              color={curve.color}
              traceT={
                curve.showTrace && isParametricMode ? animProgress : undefined
              }
              showVelocity={curve.showVelocity && isParametricMode}
            />
          );
        })}
      </Mafs>

      {/* Hover-trace marker overlay (snaps to the traced curve) */}
      {showMarker && (
        <div className="pointer-events-none absolute inset-0 z-10">
          {/* Dropline from the curve point to the x-axis */}
          <div
            style={{
              position: 'absolute',
              left: `${toLeftPct(hover!.mx)}%`,
              top: `${Math.min(toTopPct(traceY!), toTopPct(0))}%`,
              height: `${Math.abs(toTopPct(traceY!) - toTopPct(0))}%`,
              borderLeft: `1px dashed ${traceColor}`,
              opacity: 0.55,
            }}
          />
          {/* Dot on the curve */}
          <div
            style={{
              position: 'absolute',
              left: `${toLeftPct(hover!.mx)}%`,
              top: `${toTopPct(traceY!)}%`,
              width: 10,
              height: 10,
              marginLeft: -5,
              marginTop: -5,
              borderRadius: 9999,
              background: traceColor,
              boxShadow: `0 0 0 4px color-mix(in srgb, ${traceColor} 30%, transparent)`,
            }}
          />
        </div>
      )}

      {/* Mouse capture + readout. Sits above Mafs to track the pointer. */}
      <div
        className="absolute inset-0 z-20"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ pointerEvents: 'auto' }}
      />

      {/* Readout badge */}
      {hover && (
        <div
          className="pointer-events-none absolute bottom-3 right-3 z-30 rounded-md px-2.5 py-1 font-mono text-[11px] tabular-nums backdrop-blur-sm"
          style={{
            background: 'rgba(17, 17, 24, 0.85)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>x: </span>
          <span style={{ color: 'var(--text-primary)' }}>{fmt(hover.mx)}</span>
          <span className="mx-1.5" style={{ color: 'var(--border)' }}>│</span>
          {tracedFn && traceY != null && isFinite(traceY) ? (
            <>
              <span style={{ color: traceColor }}>{tracedFn.name}</span>
              <span style={{ color: 'var(--text-muted)' }}> = </span>
              <span style={{ color: 'var(--text-primary)' }}>{fmt(traceY)}</span>
            </>
          ) : (
            <>
              <span style={{ color: 'var(--text-muted)' }}>y: </span>
              <span style={{ color: 'var(--text-primary)' }}>{fmt(hover.my)}</span>
            </>
          )}
        </div>
      )}

      {/* Empty state overlay */}
      {visibleFns.length === 0 && parametric2D.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <div
            className="rounded-lg px-6 py-4 text-center backdrop-blur-sm"
            style={{
              background: 'rgba(17, 17, 24, 0.6)',
              border: '1px solid var(--border)',
            }}
          >
            <p
              className="text-sm font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              Add a function to start visualizing
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              Browse the sidebar or type a custom expression
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
