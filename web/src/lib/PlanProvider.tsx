import { useCallback, useMemo, useState, type ReactNode } from "react";
import { PlanContext, loadPlan, planReducer, savePlan, type PlanAction, type PlanState } from "./plan";

export default function PlanProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PlanState>(loadPlan);

  const dispatch = useCallback((action: PlanAction) => {
    setState((prev) => {
      const next = planReducer(prev, action);
      if (next !== prev) savePlan(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);
  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}
