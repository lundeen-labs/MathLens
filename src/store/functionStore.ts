import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MathFunction } from '../types/function';
import { FUNCTION_COLORS } from '../types/function';
import { useHistoryStore } from './historyStore';

interface FunctionStore {
  functions: MathFunction[];
  selectedId: string | null;
  nextColorIndex: number;

  addFunction: (fn: Omit<MathFunction, 'id' | 'color' | 'visible'>) => string;
  removeFunction: (id: string) => void;
  updateParam: (functionId: string, paramName: string, value: number) => void;
  toggleVisible: (id: string) => void;
  selectFunction: (id: string | null) => void;
  clearAll: () => void;
  updateExpression: (id: string, expression: string, latex: string) => void;
}

export const useFunctionStore = create<FunctionStore>()(
  persist(
    (set, get) => ({
      functions: [],
      selectedId: null,
      nextColorIndex: 0,

      addFunction: (fn) => {
        const id = crypto.randomUUID();
        const { nextColorIndex } = get();
        const color = FUNCTION_COLORS[nextColorIndex % FUNCTION_COLORS.length];

        set((state) => ({
          functions: [...state.functions, { ...fn, id, color, visible: true }],
          nextColorIndex: state.nextColorIndex + 1,
          selectedId: id,
        }));

        // Log every add to history (single funnel for browser/bar/combiner/share)
        useHistoryStore.getState().addEntry({
          name: fn.name,
          expression: fn.expression,
          latex: fn.latex,
        });

        return id;
      },

      removeFunction: (id) =>
        set((state) => ({
          functions: state.functions.filter((f) => f.id !== id),
          selectedId: state.selectedId === id ? null : state.selectedId,
        })),

      updateParam: (functionId, paramName, value) =>
        set((state) => ({
          functions: state.functions.map((f) =>
            f.id === functionId
              ? {
                  ...f,
                  params: f.params.map((p) =>
                    p.name === paramName ? { ...p, value } : p
                  ),
                }
              : f
          ),
        })),

      toggleVisible: (id) =>
        set((state) => ({
          functions: state.functions.map((f) =>
            f.id === id ? { ...f, visible: !f.visible } : f
          ),
        })),

      selectFunction: (id) => set({ selectedId: id }),

      clearAll: () => set({ functions: [], selectedId: null, nextColorIndex: 0 }),

      updateExpression: (id, expression, latex) =>
        set((state) => ({
          functions: state.functions.map((f) =>
            f.id === id ? { ...f, expression, latex } : f
          ),
        })),
    }),
    {
      name: 'mathlens-functions',
      partialize: (s) => ({
        functions: s.functions,
        selectedId: s.selectedId,
        nextColorIndex: s.nextColorIndex,
      }),
    }
  )
);
