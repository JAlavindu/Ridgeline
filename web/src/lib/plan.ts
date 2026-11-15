import { createContext, useContext } from "react";

/** Where a scenario lands: a site from the library, or coordinates the user picked. */
export type PlanSite =
  | { kind: "preset"; siteId: string }
  | { kind: "custom"; lat: number; lon: number; label: string };

/** One card on the scenario board: a site, a start time (UTC) and a mission length. */
export interface ScenarioCard {
  id: string;
  site: PlanSite;
  startUtc: string;      // "YYYY-MM-DDTHH:mm", read as UTC (same as the datetime-local inputs)
  missionDays: number;   // 1..30
}

export interface PlanState {
  cards: ScenarioCard[];
  selectedId: string | null;
}

export const MAX_CARDS = 4;
export const STORAGE_KEY = "ridgeline.plan.v1";

let counter = 0;
export function newId(): string {
  counter += 1;
  return `c${Date.now().toString(36)}${counter}`;
}

export const DEFAULT_PLAN: PlanState = (() => {
  const a: ScenarioCard = { id: "default-a", site: { kind: "preset", siteId: "connecting-ridge" }, startUtc: "2026-12-01T00:00", missionDays: 14 };
  const b: ScenarioCard = { id: "default-b", site: { kind: "preset", siteId: "im-2" }, startUtc: "2026-12-01T00:00", missionDays: 14 };
  return { cards: [a, b], selectedId: a.id };
})();

export type PlanAction =
  | { type: "add"; card: Omit<ScenarioCard, "id"> }
  | { type: "update"; id: string; patch: Partial<Omit<ScenarioCard, "id">> }
  | { type: "remove"; id: string }
  | { type: "duplicate"; id: string }
  | { type: "select"; id: string };

/** Pure state changes for the board. Never more than MAX_CARDS; never fewer than one. */
export function planReducer(state: PlanState, action: PlanAction): PlanState {
  switch (action.type) {
    case "add": {
      if (state.cards.length >= MAX_CARDS) return state;
      const card = { ...action.card, id: newId() };
      return { cards: [...state.cards, card], selectedId: card.id };
    }
    case "update":
      return { ...state, cards: state.cards.map((c) => (c.id === action.id ? { ...c, ...action.patch } : c)) };
    case "remove": {
      if (state.cards.length <= 1) return state;
      const cards = state.cards.filter((c) => c.id !== action.id);
      const selectedId = state.selectedId === action.id ? cards[0].id : state.selectedId;
      return { cards, selectedId };
    }
    case "duplicate": {
      const source = state.cards.find((c) => c.id === action.id);
      if (!source || state.cards.length >= MAX_CARDS) return state;
      const copy = { ...source, id: newId() };
      const at = state.cards.indexOf(source) + 1;
      return { cards: [...state.cards.slice(0, at), copy, ...state.cards.slice(at)], selectedId: copy.id };
    }
    case "select":
      return state.cards.some((c) => c.id === action.id) ? { ...state, selectedId: action.id } : state;
  }
}

export function loadPlan(): PlanState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PLAN;
    const parsed = JSON.parse(raw) as PlanState;
    if (!Array.isArray(parsed.cards) || parsed.cards.length === 0) return DEFAULT_PLAN;
    return { cards: parsed.cards.slice(0, MAX_CARDS), selectedId: parsed.selectedId ?? parsed.cards[0].id };
  } catch {
    return DEFAULT_PLAN;
  }
}

export function savePlan(state: PlanState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage blocked: the board still works, it just isn't remembered
  }
}

/** The current UTC hour as a datetime-local value, e.g. "2026-11-15T04:00". */
export function thisUtcHour(): string {
  return new Date().toISOString().slice(0, 13) + ":00";
}

export interface PlanContextValue {
  state: PlanState;
  dispatch: (action: PlanAction) => void;
}

export const PlanContext = createContext<PlanContextValue>({ state: DEFAULT_PLAN, dispatch: () => {} });

export function usePlan(): PlanContextValue {
  return useContext(PlanContext);
}
