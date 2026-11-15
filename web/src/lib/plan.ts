import { createContext, useContext } from "react";

/** Where a scenario lands: a site from the library, or coordinates the user picked. */
export type PlanSite =
  | { kind: "preset"; siteId: string }
  | { kind: "custom"; lat: number; lon: number; label: string };

/** The mission every column shares by default: one start time (UTC) and one length, so the comparison is fair. */
export interface Mission {
  startUtc: string;      // "YYYY-MM-DDTHH:mm", read as UTC (same as the datetime-local inputs)
  missionDays: number;   // 1..MAX_MISSION_DAYS
}

/**
 * One column on the board: a site, plus its start and length. Normally these follow the shared mission;
 * with `ownDates` a column keeps its own (for comparing launch dates).
 */
export interface ScenarioCard extends Mission {
  id: string;
  site: PlanSite;
  ownDates?: boolean;
}

export interface PlanState {
  cards: ScenarioCard[];
  selectedId: string | null;
  mission: Mission;
}

export const MAX_CARDS = 4;

/** The longest mission the planner accepts: one year. The data (2023-2032) is the only other limit. */
export const MAX_MISSION_DAYS = 365;

/**
 * Minutes between samples for a mission of this length: every 10 minutes up to 90 days, every 30 beyond, so
 * four year-long columns stay quick. Test S3 found that hourly and 10-minute sampling give the same decade
 * average sunlight to 0.00 points, so the coarser step changes the averages only negligibly; night and
 * silence lengths are then measured in 30-minute steps.
 */
export function sampleMinutesFor(days: number): number {
  return days <= 90 ? 10 : 30;
}

/** A whole number of days from 1 to MAX_MISSION_DAYS. */
export function clampDays(days: unknown): number {
  const n = Math.round(Number(days));
  return Number.isFinite(n) ? Math.min(MAX_MISSION_DAYS, Math.max(1, n)) : 14;
}
export const STORAGE_KEY = "ridgeline.plan.v1";

let counter = 0;
export function newId(): string {
  counter += 1;
  return `c${Date.now().toString(36)}${counter}`;
}

export const DEFAULT_PLAN: PlanState = (() => {
  const a: ScenarioCard = { id: "default-a", site: { kind: "preset", siteId: "connecting-ridge" }, startUtc: "2026-12-01T00:00", missionDays: 14 };
  const b: ScenarioCard = { id: "default-b", site: { kind: "preset", siteId: "im-2" }, startUtc: "2026-12-01T00:00", missionDays: 14 };
  return { cards: [a, b], selectedId: a.id, mission: { startUtc: "2026-12-01T00:00", missionDays: 14 } };
})();

export type PlanAction =
  | { type: "add"; card: Omit<ScenarioCard, "id"> }
  | { type: "update"; id: string; patch: Partial<Omit<ScenarioCard, "id">> }
  | { type: "remove"; id: string }
  | { type: "duplicate"; id: string }
  | { type: "select"; id: string }
  | { type: "mission"; patch: Partial<Mission> }
  | { type: "ownDates"; id: string; on: boolean };

/** A column that follows the shared mission takes its start and length. */
function follow(card: ScenarioCard, mission: Mission): ScenarioCard {
  return card.ownDates ? card : { ...card, startUtc: mission.startUtc, missionDays: mission.missionDays };
}

/** Pure state changes for the board. Never more than MAX_CARDS; never fewer than one. */
export function planReducer(state: PlanState, action: PlanAction): PlanState {
  switch (action.type) {
    case "add": {
      if (state.cards.length >= MAX_CARDS) return state;
      const card = follow({ ...action.card, id: newId() }, state.mission);
      return { ...state, cards: [...state.cards, card], selectedId: card.id };
    }
    case "update":
      return { ...state, cards: state.cards.map((c) => (c.id === action.id ? { ...c, ...action.patch } : c)) };
    case "remove": {
      if (state.cards.length <= 1) return state;
      const cards = state.cards.filter((c) => c.id !== action.id);
      const selectedId = state.selectedId === action.id ? cards[0].id : state.selectedId;
      return { ...state, cards, selectedId };
    }
    case "duplicate": {
      const source = state.cards.find((c) => c.id === action.id);
      if (!source || state.cards.length >= MAX_CARDS) return state;
      const copy = { ...source, id: newId() };
      const at = state.cards.indexOf(source) + 1;
      return { ...state, cards: [...state.cards.slice(0, at), copy, ...state.cards.slice(at)], selectedId: copy.id };
    }
    case "select":
      return state.cards.some((c) => c.id === action.id) ? { ...state, selectedId: action.id } : state;
    case "mission": {
      const mission = { ...state.mission, ...action.patch };
      return { ...state, mission, cards: state.cards.map((c) => follow(c, mission)) };
    }
    case "ownDates":
      return {
        ...state,
        cards: state.cards.map((c) => (c.id !== action.id ? c : action.on ? { ...c, ownDates: true } : follow({ ...c, ownDates: false }, state.mission))),
      };
  }
}

/**
 * Make a stored plan safe to use. Plans saved before the shared mission existed take the first column's
 * dates as the mission; any column with different dates keeps them as its own.
 */
export function normalizePlan(parsed: Partial<PlanState> | null | undefined): PlanState {
  if (!parsed || !Array.isArray(parsed.cards) || parsed.cards.length === 0) return DEFAULT_PLAN;
  const cards = parsed.cards.slice(0, MAX_CARDS).map((c) => ({ ...c, missionDays: clampDays(c.missionDays) }));
  const first = cards[0];
  const mission: Mission =
    parsed.mission && typeof parsed.mission.startUtc === "string" && Number.isFinite(parsed.mission.missionDays)
      ? { ...parsed.mission, missionDays: clampDays(parsed.mission.missionDays) }
      : { startUtc: first.startUtc, missionDays: first.missionDays };
  const kept = cards.map((c) =>
    parsed.mission ? c : { ...c, ownDates: c.startUtc !== mission.startUtc || c.missionDays !== mission.missionDays },
  );
  const selectedId = kept.some((c) => c.id === parsed.selectedId) ? parsed.selectedId! : kept[0].id;
  return { cards: kept.map((c) => follow(c, mission)), selectedId, mission };
}

export function loadPlan(): PlanState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PLAN;
    return normalizePlan(JSON.parse(raw) as Partial<PlanState>);
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
