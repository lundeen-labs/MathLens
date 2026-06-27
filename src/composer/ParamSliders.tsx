import * as Slider from '@radix-ui/react-slider';
import { useFunctionStore } from '../store/functionStore';
import { InlineMath } from 'react-katex';
import type { FunctionParam } from '../types/function';

// ── Individual param slider ──────────────────────────────────────────────────

function ParamSlider({
  param,
  color,
  onChange,
}: {
  param: FunctionParam;
  color: string;
  onChange: (value: number) => void;
}) {
  const pct = ((param.value - param.min) / (param.max - param.min)) * 100;

  return (
    <div className="flex min-w-[200px] flex-1 flex-col gap-1">
      {/* Label + number input */}
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          {param.label}{' '}
          <span className="font-normal" style={{ color: 'var(--text-muted)' }}>
            ({param.name})
          </span>
        </span>
        <input
          type="number"
          min={param.min}
          max={param.max}
          step={param.step}
          value={Number(param.value.toFixed(4))}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) {
              onChange(Math.max(param.min, Math.min(param.max, v)));
            }
          }}
          className="w-[68px] rounded border bg-transparent px-1.5 py-0.5 text-right text-xs tabular-nums outline-none transition-colors focus:border-indigo-500"
          style={{
            color: 'var(--text-primary)',
            borderColor: 'var(--border)',
          }}
        />
      </div>

      {/* Radix slider */}
      <Slider.Root
        className="relative flex h-5 w-full touch-none select-none items-center"
        value={[param.value]}
        min={param.min}
        max={param.max}
        step={param.step}
        onValueChange={([v]) => onChange(v)}
      >
        <Slider.Track
          className="relative h-1 grow rounded-full"
          style={{ background: 'var(--border)' }}
        >
          <Slider.Range
            className="absolute h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${color}, ${color}cc)`,
              width: `${pct}%`,
            }}
          />
        </Slider.Track>
        <Slider.Thumb
          className="block h-4 w-4 cursor-grab rounded-full border-2 bg-white transition-shadow duration-150 hover:shadow-[0_0_0_4px_rgba(99,102,241,0.25)] focus:shadow-[0_0_0_4px_rgba(99,102,241,0.4)] focus:outline-none active:cursor-grabbing"
          style={{ borderColor: color }}
        />
      </Slider.Root>

      {/* Description */}
      {param.description && (
        <span
          className="text-[10px] leading-tight"
          style={{ color: 'var(--text-muted)' }}
        >
          {param.description}
        </span>
      )}
    </div>
  );
}

// ── Main ParamSliders panel ──────────────────────────────────────────────────

export default function ParamSliders() {
  const selectedId = useFunctionStore((s) => s.selectedId);
  const fn = useFunctionStore((s) =>
    s.functions.find((f) => f.id === s.selectedId),
  );
  const updateParam = useFunctionStore((s) => s.updateParam);

  if (!selectedId || !fn || fn.params.length === 0) return null;

  return (
    <div
      className="flex max-h-[42%] shrink-0 flex-col gap-3 overflow-y-auto px-4 py-3"
      style={{
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border)',
      }}
    >
      {/* Header: function name + LaTeX */}
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: fn.color }}
        />
        <span
          className="text-xs font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          {fn.name}
        </span>
        <span className="katex-card text-[10px]" style={{ color: 'var(--text-muted)' }}>
          <InlineMath math={fn.latex} />
        </span>
      </div>

      {/* Parameter sliders */}
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        {fn.params.map((p) => (
          <ParamSlider
            key={p.name}
            param={p}
            color={fn.color}
            onChange={(value) => updateParam(fn.id, p.name, value)}
          />
        ))}
      </div>
    </div>
  );
}
